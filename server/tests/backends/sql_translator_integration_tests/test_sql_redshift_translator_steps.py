import json
from os import environ
from typing import Any

import pandas as pd
import pytest
from sqlalchemy import create_engine
from sqlalchemy.engine import Engine
from sqlalchemy.engine.url import URL
from tenacity import retry, stop_after_attempt, wait_fixed
from toucan_connectors.common import nosql_apply_parameters_to_query

from tests.utils import assert_dataframes_equals, get_spec_from_json_fixture, retrieve_case
from weaverbird.backends.pypika_translator.dialects import SQLDialect
from weaverbird.backends.pypika_translator.translate import translate_pipeline
from weaverbird.pipeline import PipelineWithVariables

_HOST = "redshift-dev.981243877028.eu-west-3.redshift-serverless.amazonaws.com"
_USER = "integrationtests_reader"
_DATABASE = "weaverbird_integration_tests"
_PASSWORD = environ["REDSHIFT_PASSWORD"]
_PORT = 5439


@retry(stop=stop_after_attempt(5), wait=wait_fixed(5))
def _create_engine() -> Engine:
    engine = create_engine(
        url=URL.create(
            drivername="redshift+redshift_connector",
            host=_HOST,
            port=_PORT,
            database=_DATABASE,
            username=_USER,
            password=_PASSWORD,
        )
    )
    with engine.connect() as conn:
        conn.execute("SELECT 1;").fetchall()

    return engine


@pytest.fixture(scope="module")
def engine():
    return _create_engine()


_BEERS_TABLE_COLUMNS = [
    "price_per_l",
    "alcohol_degree",
    "name",
    "cost",
    "beer_kind",
    "volume_ml",
    "brewing_date",
    "nullable_name",
]


@pytest.mark.parametrize(
    "case_id, case_spec_file", retrieve_case("sql_translator", "redshift_pypika")
)
def test_redshift_translator_pipeline(
    engine: Any, case_id: str, case_spec_file: str, available_variables: dict
):
    pipeline_spec = get_spec_from_json_fixture(case_id, case_spec_file)

    steps = [{"name": "domain", "domain": "beers_tiny"}] + pipeline_spec["step"]["pipeline"]
    pipeline = PipelineWithVariables(steps=steps).render(
        available_variables, nosql_apply_parameters_to_query
    )

    query = translate_pipeline(
        sql_dialect=SQLDialect.REDSHIFT,
        pipeline=pipeline,
        tables_columns={"beers_tiny": _BEERS_TABLE_COLUMNS},
        db_schema=None,
    )
    expected = pd.read_json(json.dumps(pipeline_spec["expected"]), orient="table")
    result: pd.DataFrame = pd.read_sql(query, engine)
    assert_dataframes_equals(expected, result)
