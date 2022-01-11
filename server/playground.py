"""
A very simple webserver to test and develop weaverbird.

Routes:
- `/`: serves the playground static files
- `/pandas`: pandas backend
    - GET: returns the available domains
    - POST: execute the pipeline in the body of the request and returns the transformed data
- `/mongo`:
    - GET: return the available collections in the database
    - POST: execute the aggregation pipeline and return a page of it (limit, offset) along with total count and types
- `/snowflake`:
    - GET: return the available tables in the database
- `/health`: simple health check

Run it with `QUART_APP=playground QUART_ENV=development quart run`

Environment variables:
- for mongo, MONGODB_CONNECTION_STRING (default to localhost:27017) and MONGODB_DATABASE_NAME (default to 'data')
- for snowflake, SNOWFLAKE_USER, SNOWFLAKE_PASSWORD, SNOWFLAKE_ACCOUNT and SNOWFLAKE_DATABASE
"""
import json
import os
from datetime import datetime
from glob import glob
from os.path import basename, splitext
from typing import Dict, Union

import pandas as pd
import snowflake.connector
from pandas.io.json import build_table_schema
from pymongo import MongoClient
from quart import Quart, Request, Response, jsonify, request, send_file

from weaverbird.backends.pandas_executor.pipeline_executor import (
    preview_pipeline as pandas_preview_pipeline,
)
from weaverbird.backends.sql_translator.sql_pipeline_translator import (
    translate_pipeline as sql_translate_pipeline,
)
from weaverbird.pipeline import Pipeline

app = Quart(__name__)


@app.route('/health', methods=['GET'])
def handle_health_request():
    return 'OK'


def parse_js_datetime(v):
    if isinstance(v, str) and v.endswith('Z'):
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


### Pandas back-end routes

# Load all csv in playground's pandas datastore
csv_files = glob('../playground/datastore/*.csv')
json_files = glob('../playground/datastore/*.json')
DOMAINS = {
    **{splitext(basename(csv_file))[0]: pd.read_csv(csv_file) for csv_file in csv_files},
    **{
        splitext(basename(json_file))[0]: pd.read_json(json_file, orient='table')
        for json_file in json_files
    },
}


def get_available_domains():
    return list(DOMAINS.keys())


def execute_pipeline(pipeline_steps, **kwargs) -> str:
    # Validation
    pipeline = Pipeline(steps=pipeline_steps)

    # Url parameters are only strings, these two must be understood as numbers
    if 'limit' in kwargs:
        kwargs['limit'] = int(kwargs['limit'])
    if 'offset' in kwargs:
        kwargs['offset'] = int(kwargs['offset'])

    return pandas_preview_pipeline(
        pipeline=pipeline,
        domain_retriever=lambda domain: DOMAINS[domain],
        **kwargs,
    )


@app.route('/pandas', methods=['GET', 'POST'])
async def handle_pandas_backend_request():
    if request.method == 'GET':
        return jsonify(get_available_domains())

    elif request.method == 'POST':
        try:
            pipeline = await parse_request_json(request)
            return Response(
                execute_pipeline(pipeline, **request.args),
                mimetype='application/json',
            )
        except Exception as e:
            errmsg = f'{e.__class__.__name__}: {e}'
            return jsonify(errmsg), 400


### Mongo back-end routes
mongo_client = MongoClient(os.getenv('MONGODB_CONNECTION_STRING'))
mongo_db = mongo_client[os.getenv('MONGODB_DATABASE_NAME', default='data')]


def facetize_mongo_aggregation(query, limit, offset):
    """
    Transform an aggregation query into a `$facet` one so that we can get in a single
     query both total query count (independently of `$limit` or `$skip` operators) and
    the query results.
    """
    if not len(query):
        query = [{'$match': {}}]

    new_query = [
        *query,
        {
            '$facet': {
                'state_total_count': [
                    {
                        '$group': {
                            '_id': None,
                            'count': {
                                '$sum': 1,
                            },
                        },
                    },
                ],
                'stage_results': [
                    {
                        '$skip': offset,
                    },
                    {
                        '$limit': limit,
                    },
                    {'$project': {'_id': 0}},
                ],
                'stage_types': [
                    {
                        '$skip': offset,
                    },
                    {
                        '$limit': limit,
                    },
                    {'$group': {'_id': None, '_vqbAppArray': {'$push': '$$ROOT'}}},
                    {'$unwind': {'path': "$_vqbAppArray", 'includeArrayIndex': "_vqbAppIndex"}},
                    {
                        '$project': {
                            '_vqbAppArray': {
                                '$objectToArray': '$_vqbAppArray',
                            },
                            '_vqbAppIndex': 1,
                        },
                    },
                    {
                        '$unwind': '$_vqbAppArray',
                    },
                    {
                        '$project': {
                            'column': '$_vqbAppArray.k',
                            'type': {
                                '$type': '$_vqbAppArray.v',
                            },
                            '_vqbAppIndex': 1,
                        },
                    },
                    {
                        '$group': {
                            '_id': '$_vqbAppIndex',
                            '_vqbAppArray': {
                                '$addToSet': {
                                    'column': '$column',
                                    'type': '$type',
                                },
                            },
                        },
                    },
                    {
                        '$project': {
                            '_vqbAppTmpObj': {
                                '$arrayToObject': {
                                    '$zip': {
                                        'inputs': ['$_vqbAppArray.column', '$_vqbAppArray.type'],
                                    },
                                },
                            },
                        },
                    },
                    {
                        '$replaceRoot': {
                            'newRoot': '$_vqbAppTmpObj',
                        },
                    },
                ],
            },
        },
        {
            '$unwind': '$state_total_count',
        },
        {
            '$project': {
                'count': '$state_total_count.count',
                'data': '$stage_results',
                'types': '$stage_types',
            },
        },
    ]

    return new_query


@app.route('/mongo', methods=['GET', 'POST'])
async def handle_mongo_backend_request():
    if request.method == 'GET':
        return jsonify(mongo_db.list_collection_names())

    elif request.method == 'POST':
        try:
            req_params = await parse_request_json(request)

            query = req_params['query']
            collection = req_params['collection']
            limit = req_params['limit']
            offset = req_params['offset']

            facetized_query = facetize_mongo_aggregation(query, limit, offset)
            results = list(mongo_db[collection].aggregate(facetized_query))
            # ObjectID are not JSON serializable, so remove them
            for row in results:
                if '_id' in row:
                    del row['_id']

            # Aggregation does not return correct fields if there is no results
            if len(results) == 0:
                results = [{'count': 0, 'data': [], 'types': []}]

            return jsonify(results)
        except Exception as e:
            errmsg = f'{e.__class__.__name__}: {e}'
            return jsonify(errmsg), 400


### Snowflake back-end routes
if os.getenv('SNOWFLAKE_ACCOUNT'):
    snowflake_connexion = snowflake.connector.connect(
        user=os.getenv('SNOWFLAKE_USER'),
        password=os.getenv('SNOWFLAKE_PASSWORD'),
        account=os.getenv('SNOWFLAKE_ACCOUNT'),
        database=os.getenv('SNOWFLAKE_DATABASE'),
        client_session_keep_alive=True,
    )


def sql_table_retriever(t):
    return f'SELECT * FROM "{t}"'


def snowflake_query_describer(domain: str, query_string: str = None) -> Union[Dict[str, str], None]:
    #  See https://docs.snowflake.com/en/user-guide/python-connector-api.html#type-codes
    type_code_mapping = {
        0: 'float',
        1: 'real',
        2: 'text',
        3: 'date',
        4: 'timestamp',
        5: 'variant',
        6: 'timestamp_ltz',
        7: 'timestamp_tz',
        8: 'timestamp_ntz',
        9: 'object',
        10: 'array',
        11: 'binary',
        12: 'time',
        13: 'boolean',
    }

    with snowflake_connexion.cursor() as cursor:
        describe_res = cursor.describe(f'SELECT * FROM "{domain}"' if domain else query_string)
        res = {r.name: type_code_mapping.get(r.type_code) for r in describe_res}
        return res


def snowflake_query_executor(domain: str, query_string: str = None) -> Union[pd.DataFrame, None]:
    with snowflake_connexion.cursor() as cursor:
        res = cursor.execute(domain if domain else query_string).fetchall()
        return res.fetch_pandas_all()


@app.route('/snowflake', methods=['GET', 'POST'])
async def handle_snowflake_backend_request():
    if request.method == 'GET':
        tables_info = snowflake_connexion.cursor().execute('SHOW TABLES;').fetchall()
        return jsonify([table_infos[1] for table_infos in tables_info])

    elif request.method == 'POST':
        pipeline = await parse_request_json(request)

        # Url parameters are only strings, these two must be understood as numbers
        limit = int(request.args.get('limit', 50))
        offset = int(request.args.get('offset', 0))

        query, _ = sql_translate_pipeline(
            Pipeline(steps=pipeline),
            sql_query_retriever=sql_table_retriever,
            sql_query_describer=snowflake_query_describer,
            sql_query_executor=snowflake_query_executor,
        )

        total_count = (
            snowflake_connexion.cursor().execute(f'SELECT COUNT(*) FROM ({ query })').fetchone()[0]
        )
        # By using snowflake's connector ability to turn results into a DataFrame,
        # we can re-use all the methods to parse this data- interchange format in the front-end
        df_results = (
            snowflake_connexion.cursor()
            .execute(f'SELECT * FROM ({ query }) LIMIT { limit } OFFSET { offset }')
            .fetch_pandas_all()
        )

        return Response(
            json.dumps(
                {
                    'offset': offset,
                    'limit': limit,
                    'total': total_count,
                    'schema': build_table_schema(df_results, index=False),
                    'data': json.loads(df_results.to_json(orient='records')),
                    'query': query,  # provided for inspection purposes
                }
            ),
            mimetype='application/json',
        )


### UI files


@app.route('/', methods=['GET'])
@app.route('/<path:filename>', methods=['GET'])
async def handle_static_files_request(filename=None):
    filename = filename or 'index.html'
    return await send_file('static/' + filename)
