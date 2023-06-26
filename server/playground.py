"""
A very simple webserver to test and develop weaverbird.

Routes:
- `/`: serves the playground static files
- `/pandas`: pandas backend
    - GET: returns the available domains
    - POST: execute the pipeline in the body of the request and returns a page of the transformed data
- `/mongo`:
    - GET: return the available collections in the database
    - POST: translate the pipeline to a Mongo aggregation pipeline, execute it and returns paginated results
- `/mongo-translated`:
    - POST: execute the aggregation pipeline and return a page of it (limit, offset) along with total count and types
- `/snowflake`:
    - GET: return the available tables in the database
    - POST: translate the pipeline to a Snowflake query, execute it and returns paginated results
- `/postgresql`:
    - GET: return the available tables in the database
    - POST: translate the pipeline to a SQL query, execute it and returns paginated results
- `/health`: simple health check

Run it with `QUART_APP=playground QUART_ENV=development quart run`

Environment variables:
- for mongo, MONGODB_CONNECTION_STRING (default to localhost:27017) and MONGODB_DATABASE_NAME (default to 'data')
- for snowflake, SNOWFLAKE_USER, SNOWFLAKE_PASSWORD, SNOWFLAKE_ACCOUNT and SNOWFLAKE_DATABASE
- for postgresql, POSTGRESQL_CONNECTION_STRING
"""
import json
import os
from contextlib import suppress
from datetime import datetime
from enum import Enum
from functools import cache
from glob import glob
from os.path import basename, splitext

import awswrangler as wr
import boto3
import geopandas as gpd
import pandas as pd
import psycopg
import pymysql
import snowflake.connector
from google.cloud import bigquery
from google.oauth2.service_account import Credentials
from pandas.io.json import build_table_schema
from pymongo import MongoClient
from quart import Quart, Request, Response, jsonify, request, send_file
from quart_cors import cors
from toucan_connectors.pagination import build_pagination_info

from weaverbird.backends.mongo_translator.mongo_pipeline_translator import (
    translate_pipeline as mongo_translate_pipeline,
)
from weaverbird.backends.pandas_executor.pipeline_executor import PipelineExecutionFailure
from weaverbird.backends.pandas_executor.pipeline_executor import (
    preview_pipeline as pandas_preview_pipeline,
)
from weaverbird.backends.pypika_translator.dialects import SQLDialect
from weaverbird.backends.pypika_translator.translate import (
    translate_pipeline as pypika_translate_pipeline,
)
from weaverbird.pipeline.pipeline import Pipeline, PipelineWithRefs
from weaverbird.pipeline.steps import DomainStep
from weaverbird.pipeline.steps.utils.combination import Reference

app = Quart(__name__)
if os.environ.get("ALLOW_ORIGIN"):
    app = cors(app, allow_origin=os.environ.get("ALLOW_ORIGIN"))


@app.route("/health", methods=["GET"])
def handle_health_request():
    return "OK"


def parse_js_datetime(v):
    if isinstance(v, str) and v.endswith("Z"):
        try:
            return datetime.fromisoformat(v[:-1])
        except ValueError:
            pass
    return v


def json_js_datetime_parser(dct):
    """
    JS serialize UTC datetimes to ISO format with a Z, while python isoformat doesn't add Z
    """
    for k, v in dct.items():
        if isinstance(v, list):
            dct[k] = [parse_js_datetime(d) for d in v]
        else:
            dct[k] = parse_js_datetime(v)
    return dct


async def parse_request_json(request: Request):
    """
    Parse the request with a custom JSON parser so that types are preserved (such as dates)
    """
    return json.loads(await request.get_data(), object_hook=json_js_datetime_parser)


class ColumnType(str, Enum):
    INTEGER = "integer"
    FLOAT = "float"
    BOOLEAN = "boolean"
    DATE = "date"
    STRING = "string"
    OBJECT = "object"


### Pandas back-end routes

# Load all csv in playground's pandas datastore
csv_files = glob("../playground/datastore/*.csv")
json_files = glob("../playground/datastore/*.json")
geojson_files = glob("../playground/datastore/*.geojson")

DOMAINS = {
    **{splitext(basename(csv_file))[0]: pd.read_csv(csv_file) for csv_file in csv_files},
    **{
        splitext(basename(json_file))[0]: pd.read_json(json_file, orient="table")
        for json_file in json_files
    },
    **{
        splitext(basename(geojson_file))[0]: gpd.read_file(geojson_file)
        for geojson_file in geojson_files
    },
}


def get_available_domains():
    return list(DOMAINS.keys())


def sanitize_table_schema(schema: dict) -> dict:
    return {
        "fields": [
            {"name": field["name"], "type": "geometry"}
            if field.get("extDtype") == "geometry"
            else field
            for field in schema["fields"]
        ]
    }


def execute_pipeline(pipeline_steps, **kwargs) -> str:
    # Validation
    pipeline = Pipeline(steps=pipeline_steps)

    output = json.loads(
        pandas_preview_pipeline(
            pipeline=pipeline,
            domain_retriever=lambda domain: DOMAINS[domain],
            # Converting URL params to ints
            offset=int(kwargs.get("offset", 50)),
            limit=int(kwargs.get("limit", 50)),
        )
    )

    pagination_info = build_pagination_info(
        offset=output.pop("offset"),
        limit=output.pop("limit"),
        total_rows=output.pop("total"),
        retrieved_rows=len(output["data"]),
    ).dict()

    return json.dumps(
        {
            **output,
            "schema": sanitize_table_schema(output["schema"]),
            "pagination_info": pagination_info,
        }
    )


@app.route("/pandas", methods=["GET", "POST"])
async def handle_pandas_backend_request():
    if request.method == "GET":
        return jsonify(get_available_domains())

    elif request.method == "POST":
        try:
            pipeline = await parse_request_json(request)
            return Response(
                execute_pipeline(pipeline, **request.args),
                mimetype="application/json",
            )
        except PipelineExecutionFailure as e:
            return (
                jsonify(
                    {
                        "step": e.step.dict(),
                        "index": e.index,
                        "message": e.message,
                    }
                ),
                400,
            )
        except Exception as e:
            errmsg = f"{e.__class__.__name__}: {e}"
            return jsonify(errmsg), 400


### Mongo back-end routes
mongo_client = MongoClient(os.getenv("MONGODB_CONNECTION_STRING"))
mongo_db = mongo_client[os.getenv("MONGODB_DATABASE_NAME", default="data")]


def facetize_mongo_aggregation(query, limit, offset):
    """
    Transform an aggregation query into a `$facet` one so that we can get in a single
     query both total query count (independently of `$limit` or `$skip` operators) and
    the query results.
    """
    if not len(query):
        query = [{"$match": {}}]

    new_query = [
        *query,
        {
            "$facet": {
                "state_total_count": [
                    {
                        "$group": {
                            "_id": None,
                            "count": {
                                "$sum": 1,
                            },
                        },
                    },
                ],
                "stage_results": [
                    {
                        "$skip": offset,
                    },
                    {
                        "$limit": limit,
                    },
                    {"$project": {"_id": 0}},
                ],
                "stage_types": [
                    {
                        "$skip": offset,
                    },
                    {
                        "$limit": limit,
                    },
                    {"$group": {"_id": None, "_vqbAppArray": {"$push": "$$ROOT"}}},
                    {"$unwind": {"path": "$_vqbAppArray", "includeArrayIndex": "_vqbAppIndex"}},
                    {
                        "$project": {
                            "_vqbAppArray": {
                                "$objectToArray": "$_vqbAppArray",
                            },
                            "_vqbAppIndex": 1,
                        },
                    },
                    {
                        "$unwind": "$_vqbAppArray",
                    },
                    {
                        "$project": {
                            "column": "$_vqbAppArray.k",
                            "type": {
                                "$type": "$_vqbAppArray.v",
                            },
                            "_vqbAppIndex": 1,
                        },
                    },
                    {
                        "$group": {
                            "_id": "$_vqbAppIndex",
                            "_vqbAppArray": {
                                "$addToSet": {
                                    "column": "$column",
                                    "type": "$type",
                                },
                            },
                        },
                    },
                    {
                        "$project": {
                            "_vqbAppTmpObj": {
                                "$arrayToObject": {
                                    "$zip": {
                                        "inputs": ["$_vqbAppArray.column", "$_vqbAppArray.type"],
                                    },
                                },
                            },
                        },
                    },
                    {
                        "$replaceRoot": {
                            "newRoot": "$_vqbAppTmpObj",
                        },
                    },
                ],
            },
        },
        {
            "$unwind": "$state_total_count",
        },
        {
            "$project": {
                "count": "$state_total_count.count",
                "data": "$stage_results",
                "types": "$stage_types",
            },
        },
    ]

    return new_query


def execute_mongo_aggregation_query(collection, query, limit, offset):
    facetized_query = facetize_mongo_aggregation(query, limit, offset)
    results = list(mongo_db[collection].aggregate(facetized_query))

    # ObjectID are not JSON serializable, so remove them
    for row in results:
        if "_id" in row:
            del row["_id"]

    # Aggregation does not return correct fields if there is no results
    if len(results) == 0:
        results = [{"count": 0, "data": [], "types": []}]

    return results


async def dummy_reference_resolver(r: Reference) -> list[dict]:
    return [DomainStep(domain=r.uid).dict()]


@app.route("/mongo", methods=["GET", "POST"])
async def handle_mongo_backend_request():
    if request.method == "GET":
        return jsonify(mongo_db.list_collection_names())
    elif request.method == "POST":
        try:
            req_params = await parse_request_json(request)
            pipeline_with_refs = PipelineWithRefs(steps=req_params["pipeline"])  # Validation
            pipeline = await pipeline_with_refs.resolve_references(dummy_reference_resolver)
            mongo_query = mongo_translate_pipeline(pipeline)

            offset = req_params.get("offset", 0)
            limit = req_params.get("limit", 1e9)  # Setting a very large limit

            results = execute_mongo_aggregation_query(
                req_params["collection"],
                mongo_query,
                limit,
                offset,
            )[0]

            pagination_info = build_pagination_info(
                offset=offset,
                limit=limit,
                total_rows=results["count"],
                retrieved_rows=len(results["data"]),
            )

            return jsonify(
                {
                    "pagination_info": pagination_info.dict(),
                    "data": results["data"],
                    "types": results["types"],
                    "query": mongo_query,  # provided for inspection purposes
                }
            )
        except Exception as e:
            errmsg = f"{e.__class__.__name__}: {e}"
            return jsonify(errmsg), 400


@app.route("/mongo-translated", methods=["POST"])
async def handle_mongo_translated_backend_request():
    try:
        req_params = await parse_request_json(request)
        results = execute_mongo_aggregation_query(
            req_params["collection"], req_params["query"], req_params["limit"], req_params["offset"]
        )[0]
        pagination_info = build_pagination_info(
            offset=req_params["offset"],
            limit=req_params["limit"],
            total_rows=results["count"],
            retrieved_rows=len(results["data"]),
        )

        return jsonify(
            {
                "pagination_info": pagination_info.dict(),
                "data": results["data"],
                "types": results["types"],
                "query": req_params["query"],  # provided for inspection purposes
            }
        )
    except Exception as e:
        errmsg = f"{e.__class__.__name__}: {e}"
        return jsonify(errmsg), 400


### Snowflake back-end routes
_SNOWFLAKE_CONNECTION = None
if os.getenv("SNOWFLAKE_ACCOUNT"):
    try:
        _SNOWFLAKE_CONNECTION = snowflake.connector.connect(
            user=os.getenv("SNOWFLAKE_USER"),
            password=os.getenv("SNOWFLAKE_PASSWORD"),
            account=os.getenv("SNOWFLAKE_ACCOUNT"),
            database=os.getenv("SNOWFLAKE_DATABASE"),
            client_session_keep_alive=True,
        )
    except Exception as exc:
        print(f"[WARNING] Could not establish connection to snowflake: {exc}")

if _SNOWFLAKE_CONNECTION is not None:

    def snowflake_query_describer(domain: str, query_string: str = None) -> dict[str, str] | None:
        #  See https://docs.snowflake.com/en/user-guide/python-connector-api.html#type-codes
        type_code_mapping = {
            0: "float",
            1: "real",
            2: "text",
            3: "date",
            4: "timestamp",
            5: "variant",
            6: "timestamp_ltz",
            7: "timestamp_tz",
            8: "timestamp_ntz",
            9: "object",
            10: "array",
            11: "binary",
            12: "time",
            13: "boolean",
        }

        with _SNOWFLAKE_CONNECTION.cursor() as cursor:
            describe_res = cursor.describe(f'SELECT * FROM "{domain}"' if domain else query_string)
            res = {r.name: type_code_mapping.get(r.type_code) for r in describe_res}
            return res

    def snowflake_query_executor(domain: str, query_string: str = None) -> pd.DataFrame | None:
        with _SNOWFLAKE_CONNECTION.cursor() as cursor:
            res = cursor.execute(domain if domain else query_string).fetchall()
            return res.fetch_pandas_all()

    def get_table_columns():
        tables_info = _SNOWFLAKE_CONNECTION.cursor().execute("SHOW TABLES;").fetchall()
        tables_columns = {}
        for table in tables_info:
            with suppress(Exception):
                table_name = table[1]
                infos = (
                    _SNOWFLAKE_CONNECTION.cursor()
                    .execute(f'DESCRIBE TABLE "{table_name}";')
                    .fetchall()
                )
                tables_columns[table_name] = [info[0] for info in infos if info[2] == "COLUMN"]
        return tables_columns

    @app.route("/snowflake", methods=["GET", "POST"])
    async def handle_snowflake_backend_request():
        if request.method == "GET":
            tables_info = get_table_columns()
            return jsonify(list(tables_info.keys()))

        elif request.method == "POST":
            pipeline = await parse_request_json(request)

            # Url parameters are only strings, these two must be understood as numbers
            limit = int(request.args.get("limit", 50))
            offset = int(request.args.get("offset", 0))

            tables_columns = get_table_columns()

            query = pypika_translate_pipeline(
                sql_dialect=SQLDialect.SNOWFLAKE,
                pipeline=Pipeline(steps=pipeline),
                db_schema="PUBLIC",
                tables_columns=tables_columns,
            )

            total_count = (
                _SNOWFLAKE_CONNECTION.cursor()
                .execute(f"SELECT COUNT(*) FROM ({query})")
                .fetchone()[0]
            )
            # By using snowflake's connector ability to turn results into a DataFrame,
            # we can re-use all the methods to parse this data- interchange format in the front-end
            df_results = (
                _SNOWFLAKE_CONNECTION.cursor()
                .execute(f"SELECT * FROM ({query}) LIMIT {limit} OFFSET {offset}")
                .fetch_pandas_all()
            )

            return Response(
                json.dumps(
                    {
                        "pagination_info": build_pagination_info(
                            offset=offset,
                            limit=limit,
                            retrieved_rows=len(df_results),
                            total_rows=total_count,
                        ).dict(),
                        "schema": build_table_schema(df_results, index=False),
                        "data": json.loads(df_results.to_json(orient="records")),
                        "query": query,  # provided for inspection purposes
                    }
                ),
                mimetype="application/json",
            )


### Postgres back-end routes


def postgresql_type_to_data_type(pg_type: str) -> ColumnType | None:
    # https://www.postgresql.org/docs/current/datatype-numeric.html
    if (
        "float" in pg_type
        or "double" in pg_type
        or "serial" in pg_type
        or pg_type in ("decimal", "numeric", "real", "money")
    ):
        return ColumnType.FLOAT
    elif "int" in pg_type:
        return ColumnType.INTEGER
    # https://www.postgresql.org/docs/current/datatype-datetime.html
    elif "time" in pg_type or "date" in pg_type:
        return ColumnType.DATE
    # https://www.postgresql.org/docs/current/datatype-character.html
    elif "char" in pg_type or pg_type == "text":
        return ColumnType.STRING
    # https://www.postgresql.org/docs/current/datatype-boolean.html
    elif "bool" in pg_type:
        return ColumnType.BOOLEAN
    else:
        return ColumnType.OBJECT


@app.route("/postgresql", methods=["GET", "POST"])
async def handle_postgres_backend_request():
    # improve by using a connexion pool
    postgresql_connexion = await psycopg.AsyncConnection.connect(
        os.getenv("POSTGRESQL_CONNECTION_STRING")
    )
    db_schema = "public"

    if request.method == "GET":
        async with postgresql_connexion.cursor() as cur:
            tables_info_exec = await cur.execute(
                f"SELECT * FROM pg_catalog.pg_tables WHERE schemaname='{db_schema}';"
            )
            tables_info = await tables_info_exec.fetchall()
            return jsonify([table_infos[1] for table_infos in tables_info])

    if request.method == "POST":
        pipeline = await parse_request_json(request)

        # Url parameters are only strings, these two must be understood as numbers
        limit = int(request.args.get("limit", 50))
        offset = int(request.args.get("offset", 0))

        # Find all columns for all available tables
        async with postgresql_connexion.cursor() as cur:
            table_columns_exec = await cur.execute(
                "SELECT table_name, column_name FROM information_schema.columns WHERE table_schema='public';"
            )
            table_columns_results = await table_columns_exec.fetchall()
            table_columns = {}
            for table_name, table_col in table_columns_results:
                if table_name not in table_columns:
                    table_columns[table_name] = []
                table_columns[table_name].append(table_col)

        sql_query = pypika_translate_pipeline(
            sql_dialect=SQLDialect.POSTGRES,
            pipeline=Pipeline(steps=pipeline),
            db_schema=db_schema,
            tables_columns=table_columns,
        )

        async with postgresql_connexion.cursor() as cur:
            query_total_count_exec = await cur.execute(
                f"WITH Q AS ({sql_query}) SELECT COUNT(*) FROM Q"
            )
            # fetchone() returns a tuple
            query_total_count = (await query_total_count_exec.fetchone())[0]

        async with postgresql_connexion.cursor() as cur:
            query_results_page_exec = await cur.execute(
                f"WITH Q AS ({sql_query}) SELECT * FROM Q LIMIT {limit} OFFSET {offset}",
            )
            query_results_page = await query_results_page_exec.fetchall()
            query_results_desc = query_results_page_exec.description

        # Provide types for the columns
        async with postgresql_connexion.cursor() as cur:
            # oid of columns of query results are provided in the "description" attribute
            # They are mapped to base types in the system pg_type table
            types_exec = await cur.execute(
                "SELECT oid, typname FROM pg_type WHERE oid = ANY(%s)",
                ([c.type_code for c in query_results_desc or []],),
            )
            types = await types_exec.fetchall()
            query_results_columns = [
                {
                    "name": c.name,
                    "type": [
                        postgresql_type_to_data_type(t[1]) for t in types if t[0] == c.type_code
                    ][0],
                }
                for c in query_results_desc
            ]

        return {
            "pagination_info": build_pagination_info(
                offset=offset,
                limit=limit,
                retrieved_rows=len(query_results_page),
                total_rows=query_total_count,
            ).dict(),
            "results": {
                "headers": query_results_columns,
                "data": query_results_page,
            },
            "query": sql_query,  # provided for inspection purposes
        }


### Athena back-end routes
@cache
def _aws_wrangler_kwargs() -> dict[str, str | boto3.Session]:
    return {
        "boto3_session": boto3.Session(
            aws_access_key_id=os.environ["ATHENA_ACCESS_KEY_ID"],
            aws_secret_access_key=os.environ["ATHENA_SECRET_ACCESS_KEY"],
            region_name=os.environ["ATHENA_REGION"],
        ),
        "database": os.environ["ATHENA_DATABASE"],
        "s3_output": os.environ["ATHENA_OUTPUT"],
    }


@cache
def _athena_table_info() -> pd.DataFrame:
    kwargs = _aws_wrangler_kwargs()
    df = wr.catalog.tables(boto3_session=kwargs["boto3_session"], database=kwargs["database"])
    return df[~df["Table"].str.startswith("temp_table")]


@app.get("/athena")
async def handle_athena_get_request():
    return jsonify(_athena_table_info()["Table"].to_list())


@app.post("/athena")
async def handle_athena_post_request():
    pipeline = await parse_request_json(request)

    # Url parameters are only strings, these two must be understood as numbers
    limit = int(request.args.get("limit", 50))
    offset = int(request.args.get("offset", 0))

    # Find all columns for all available tables
    table_info = _athena_table_info()
    tables_columns = {
        row["Table"]: [c.strip() for c in row["Columns"].split(",")]
        for _, row in table_info.iterrows()
    }

    sql_query = (
        pypika_translate_pipeline(
            sql_dialect=SQLDialect.ATHENA,
            pipeline=Pipeline(steps=pipeline),
            tables_columns=tables_columns,
        )
        + f" OFFSET {offset} LIMIT {limit}"
    )
    result = wr.athena.read_sql_query(sql_query, **_aws_wrangler_kwargs())
    return {
        "pagination_info": build_pagination_info(
            offset=offset, limit=limit, retrieved_rows=len(result), total_rows=None
        ).dict(),
        "results": {
            "headers": result.columns.to_list(),
            "data": json.loads(result.to_json(orient="records")),
            "schema": build_table_schema(result, index=False),
        },
        "query": sql_query,  # provided for inspection purposes
    }


### BigQuery back-end routes


@cache
def _bigquery_creds() -> Credentials:
    return Credentials.from_service_account_file(os.environ["GOOGLE_BIG_QUERY_CREDENTIALS_FILE"])


def _bigquery_client() -> bigquery.Client:
    return bigquery.Client(credentials=_bigquery_creds())


def _bigquery_tables_list(client: bigquery.Client) -> list[str]:
    return [
        # This is in the `project:dataset.table` by default but SQL requires the members to be
        # separated by dots
        t.full_table_id.replace(":", ".")
        for dataset in client.list_datasets()
        for t in client.list_tables(dataset)
    ]


def _bigquery_tables_info(client: bigquery.Client) -> dict[str, list[str]]:
    return {
        table: [field.name for field in client.get_table(table).schema]
        for table in _bigquery_tables_list(client)
    }


@app.get("/google-big-query")
async def hangle_bigquery_get_request():
    return jsonify(_bigquery_tables_list(_bigquery_client()))


@app.post("/google-big-query")
async def hangle_bigquery_post_request():
    pipeline = await parse_request_json(request)

    # Url parameters are only strings, these two must be understood as numbers
    limit = int(request.args.get("limit", 50))
    offset = int(request.args.get("offset", 0))

    client = _bigquery_client()
    tables_columns = _bigquery_tables_info(client)

    sql_query = (
        pypika_translate_pipeline(
            sql_dialect=SQLDialect.GOOGLEBIGQUERY,
            pipeline=Pipeline(steps=pipeline),
            tables_columns=tables_columns,
        )
        + f" LIMIT {limit} OFFSET {offset}"
    )

    result = client.query(sql_query).result().to_dataframe()
    return {
        "pagination_info": build_pagination_info(
            offset=offset, limit=limit, retrieved_rows=len(result), total_rows=None
        ).dict(),
        "results": {
            "headers": result.columns.to_list(),
            "data": json.loads(result.to_json(orient="records")),
            "schema": build_table_schema(result, index=False),
        },
        "query": sql_query,  # provided for inspection purposes
    }


def _mysql_connection() -> pymysql.Connection:
    return pymysql.connect(
        host=os.environ["MYSQL_HOST"],
        user=os.environ["MYSQL_USER"],
        password=os.environ["MYSQL_PASSWORD"],
        database=os.environ["MYSQL_DATABASE"],
    )


### MySQL back-end routes
@app.get("/mysql")
async def handle_mysql_get_request():
    with _mysql_connection().cursor() as cursor:
        cursor.execute(
            "SELECT t.table_name FROM information_schema.tables t "
            f"WHERE t.table_type = 'BASE TABLE' AND t.table_schema = '{os.environ['MYSQL_DATABASE']}'"
        )
        tables = [table[0] for table in cursor.fetchall()]

    return jsonify(tables)


def _mysql_table_info() -> dict[str, list[str]]:
    return {
        row["table_name"]: json.loads(row["column_names"])
        for _, row in pd.read_sql(
            """SELECT t.table_name "table_name", JSON_ARRAYAGG(c.column_name) "column_names" """
            "FROM information_schema.tables t "
            "INNER JOIN information_schema.columns c ON t.table_name = c.table_name "
            "WHERE t.table_type = 'BASE TABLE' AND t.table_schema = 'playground_db' "
            "GROUP BY t.table_name "
            "ORDER BY t.table_name;",
            _mysql_connection(),
        ).iterrows()
    }


@app.post("/mysql")
async def handle_mysql_post_request():
    pipeline = await parse_request_json(request)

    # Url parameters are only strings, these two must be understood as numbers
    limit = int(request.args.get("limit", 50))
    offset = int(request.args.get("offset", 0))

    # Find all columns for all available tables
    table_info = _mysql_table_info()

    sql_query = pypika_translate_pipeline(
        sql_dialect=SQLDialect.MYSQL,
        pipeline=Pipeline(steps=pipeline),
        tables_columns=table_info,
    )
    result = pd.read_sql(sql_query, _mysql_connection())
    return {
        "pagination_info": build_pagination_info(
            offset=offset, limit=limit, retrieved_rows=len(result), total_rows=None
        ).dict(),
        "results": {
            "headers": result.columns.to_list(),
            "data": json.loads(result[offset : offset + limit].to_json(orient="records")),
            "schema": build_table_schema(result, index=False),
        },
        "query": sql_query,  # provided for inspection purposes
    }


### UI files


@app.route("/", methods=["GET"])
@app.route("/<path:filename>", methods=["GET"])
async def handle_static_files_request(filename=None):
    filename = filename or "index.html"
    # Quart does not figure out the right mimetype for .cjs files, which causes browsers to block
    # it: Loading module from “http://localhost:5000/weaverbird.umd.cjs” was blocked because of a
    # disallowed MIME type (“application/octet-stream”).
    mimetype = "text/javascript" if filename.endswith(".cjs") else None
    return await send_file("static/" + filename, mimetype=mimetype)
