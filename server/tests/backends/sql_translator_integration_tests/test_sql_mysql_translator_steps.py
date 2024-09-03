import json
import time
from io import StringIO
from os import path
from typing import Any

import pandas as pd
import pymysql
import pytest
from docker.types import Ulimit
from sqlalchemy import create_engine, text
from toucan_connectors.common import nosql_apply_parameters_to_query

from tests.utils import (
    _BEERS_TABLE_COLUMNS,
    assert_dataframes_equals,
    docker_container,
    get_spec_from_json_fixture,
    retrieve_case,
)
from weaverbird.backends.pypika_translator.dialects import SQLDialect
from weaverbird.backends.pypika_translator.translate import translate_pipeline
from weaverbird.pipeline import PipelineWithVariables

_CON_PARAMS = {
    "host": "127.0.0.1",
    "user": "ubuntu",
    "password": "ilovetoucan",
    "port": 3306,
    "database": "mysql_db",
}
_CONNECTION_STRING = f'mysql+pymysql://{_CON_PARAMS["user"]}:{_CON_PARAMS["password"]}@{_CON_PARAMS["host"]}:{_CON_PARAMS["port"]}/{_CON_PARAMS["database"]}'


@pytest.fixture(scope="module")
def engine() -> Any:
    return create_engine(_CONNECTION_STRING)


@pytest.fixture(scope="module", autouse=True)
def mysql_container():
    with docker_container(
        image_name="mysql",
        # <8 not supported
        image_version="8-debian",
        name="mysql_weaverbird_test",
        environment={
            "MYSQL_DATABASE": _CON_PARAMS["database"],
            "MYSQL_USER": _CON_PARAMS["user"],
            "MYSQL_PASSWORD": _CON_PARAMS["password"],
            "MYSQL_ROOT_PASSWORD": "root",
        },
        ports={"3306": "3306"},
        # Depending on the host's default, mysql can crash some machines because of a very high
        # memory and cpu usage
        ulimits=[Ulimit(name="nofile", soft=26677, hard=46667)],
    ) as container:
        engine = None
        while not engine:
            time.sleep(1)
            try:
                if container.status == "created" and pymysql.connect(**_CON_PARAMS):
                    dataset = pd.read_csv(f"{path.join(path.dirname(path.realpath(__file__)))}/beers.csv")
                    dataset["brewing_date"] = dataset["brewing_date"].apply(pd.to_datetime)
                    engine = create_engine(_CONNECTION_STRING)
                    dataset.to_sql("beers_tiny", engine)
            except pymysql.OperationalError:
                pass

        yield container


# Translation from Pipeline json to SQL query
@pytest.mark.serial
@pytest.mark.parametrize("case_id, case_spec_file_path", retrieve_case("sql_translator", "mysql_pypika"))
@pytest.mark.skip("MySQL result order is not consistent with CTEs")
def test_sql_translator_pipeline(case_id: str, case_spec_file_path: str, engine: Any, available_variables: dict):
    spec = get_spec_from_json_fixture(case_id, case_spec_file_path)

    steps = spec["step"]["pipeline"]
    steps.insert(0, {"name": "domain", "domain": "beers_tiny"})
    pipeline = PipelineWithVariables(steps=steps).render(available_variables, nosql_apply_parameters_to_query)

    # Convert Pipeline object to Postgres Query
    query = translate_pipeline(
        sql_dialect=SQLDialect.MYSQL,
        pipeline=pipeline,
        tables_columns={"beers_tiny": _BEERS_TABLE_COLUMNS},
        db_schema=None,
    )
    # Execute request generated from Pipeline in Postgres and get the result
    result: pd.DataFrame = pd.read_sql(text(query), engine)
    expected = pd.read_json(StringIO(json.dumps(spec["expected"])), orient="table")
    assert_dataframes_equals(expected, result)
