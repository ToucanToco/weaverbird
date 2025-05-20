import json
import time
from io import StringIO
from os import path
from typing import Any

import pandas as pd
import psycopg2
import pytest
from sqlalchemy import create_engine, text
from sqlalchemy.engine.base import OptionEngine

from tests.utils import (
    BEERS_TABLE_COLUMNS,
    assert_dataframes_equals,
    docker_container,
    get_spec_from_json_fixture,
    retrieve_case,
)
from weaverbird.backends.pypika_translator.dialects import SQLDialect
from weaverbird.backends.pypika_translator.translate import translate_pipeline
from weaverbird.pipeline import PipelineWithVariables
from weaverbird.utils.toucan_connectors import nosql_apply_parameters_to_query_with_errors

con_params = {
    "host": "127.0.0.1",
    "user": "ubuntu",
    "password": "ilovetoucan",
    "port": 5432,
    "database": "pg_db",
}
connection_string = f"postgresql://{con_params['user']}:{con_params['password']}@{con_params['host']}:{con_params['port']}/{con_params['database']}"


@pytest.fixture(scope="module")
def engine() -> Any:
    return create_engine(connection_string)


@pytest.fixture(scope="module", autouse=True)
def postgres_container():
    with docker_container(
        image_name="postgres",
        image_version="14.1-bullseye",
        name="postgres_weaverbird_test",
        environment={
            "POSTGRES_DB": "pg_db",
            "POSTGRES_USER": "ubuntu",
            "POSTGRES_PASSWORD": "ilovetoucan",
        },
        ports={"5432": "5432"},
    ) as container:
        engine = None
        while not engine:
            time.sleep(1)
            try:
                if container.status == "created" and psycopg2.connect(**con_params):
                    dataset = pd.read_csv(f"{path.join(path.dirname(path.realpath(__file__)))}/beers.csv")
                    dataset["brewing_date"] = dataset["brewing_date"].apply(pd.to_datetime)
                    engine = create_engine(connection_string)
                    dataset.to_sql("beers_tiny", engine)
            except psycopg2.OperationalError:
                pass

        yield container


# Translation from Pipeline json to SQL query
@pytest.mark.serial
@pytest.mark.parametrize("case_id, case_spec_file_path", retrieve_case("sql_translator", "postgres_pypika"))
def test_sql_translator_pipeline(
    case_id: str, case_spec_file_path: str, engine: OptionEngine, available_variables: dict
):
    spec = get_spec_from_json_fixture(case_id, case_spec_file_path)

    steps = spec["step"]["pipeline"]
    steps.insert(0, {"name": "domain", "domain": "beers_tiny"})
    pipeline = PipelineWithVariables(steps=steps).render(
        available_variables, nosql_apply_parameters_to_query_with_errors
    )

    # Convert Pipeline object to Postgres Query
    query = translate_pipeline(
        sql_dialect=SQLDialect.POSTGRES,
        pipeline=pipeline,
        tables_columns={"beers_tiny": BEERS_TABLE_COLUMNS},
        db_schema=None,
    )
    # Execute request generated from Pipeline in Postgres and get the result
    with engine.connect() as conn:
        result: pd.DataFrame = pd.read_sql(text(query), conn)
    expected = pd.read_json(StringIO(json.dumps(spec["expected"])), orient="table")
    assert_dataframes_equals(expected, result)
