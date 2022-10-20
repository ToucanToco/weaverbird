import json
from os import environ
from typing import Any

import pandas as pd
import pytest
from snowflake.sqlalchemy import URL
from sqlalchemy import create_engine, text
from toucan_connectors.common import nosql_apply_parameters_to_query

from tests.utils import assert_dataframes_equals, get_spec_from_json_fixture, retrieve_case
from weaverbird.backends.pypika_translator.dialects import SQLDialect
from weaverbird.backends.pypika_translator.translate import translate_pipeline
from weaverbird.pipeline import PipelineWithVariables

_ACCOUNT = "toucantocopartner.west-europe.azure"
_USER = "toucan_test"
_WAREHOUSE = "toucan_test"
_DATABASE = "toucan_test"
_ROLE = "toucan_test"
_SCHEMA = "toucan_test"

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


@pytest.fixture(scope="module")
def engine():
    url = URL(
        account=_ACCOUNT,
        user=_USER,
        password=environ.get("SNOWFLAKE_PASSWORD"),
        warehouse=_WAREHOUSE,
        database=_DATABASE,
        role=_ROLE,
        schema=_SCHEMA,
        authenticator="snowflake",
    )
    engine = create_engine(url)
    connection = engine.connect()
    #  to avoid issues with quoted/unquoted columns
    connection.execute("alter session set QUOTED_IDENTIFIERS_IGNORE_CASE = true;")
    yield connection
    connection.close()


@pytest.skip(
    "Should be skipped, waiting the payment of creds on november...", allow_module_level=True
)
@pytest.mark.parametrize(
    "case_id, case_spec_file", retrieve_case("sql_translator", "snowflake_pypika")
)
def test_snowflake_translator_pipeline(
    engine: Any, case_id: str, case_spec_file: str, available_variables: dict
):
    pipeline_spec = get_spec_from_json_fixture(case_id, case_spec_file)

    steps = [{"name": "domain", "domain": "beers_tiny"}] + pipeline_spec["step"]["pipeline"]
    pipeline = PipelineWithVariables(steps=steps).render(
        available_variables, nosql_apply_parameters_to_query
    )

    query = translate_pipeline(
        sql_dialect=SQLDialect.SNOWFLAKE,
        pipeline=pipeline,
        tables_columns={"beers_tiny": _BEERS_TABLE_COLUMNS},
        db_schema=None,
    )
    expected = pd.read_json(json.dumps(pipeline_spec["expected"]), orient="table")
    result: pd.DataFrame = pd.read_sql(text(query), engine)
    assert_dataframes_equals(expected, result)
