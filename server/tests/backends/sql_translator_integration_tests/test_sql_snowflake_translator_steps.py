import json
from datetime import date
from io import StringIO
from os import environ
from typing import Any
from urllib.parse import quote

import pandas as pd
import pytest
from snowflake.sqlalchemy import URL
from sqlalchemy import create_engine, text

from tests.utils import BEERS_TABLE_COLUMNS, assert_dataframes_equals, get_spec_from_json_fixture, retrieve_case
from weaverbird.backends.pypika_translator.dialects import SQLDialect
from weaverbird.backends.pypika_translator.translate import translate_pipeline
from weaverbird.pipeline import PipelineWithVariables
from weaverbird.utils.toucan_connectors import nosql_apply_parameters_to_query_with_errors


@pytest.fixture(scope="module")
def engine():
    url = URL(
        user=environ["SNOWFLAKE_USER"],
        password=quote(environ["SNOWFLAKE_PASSWORD"]),
        database=environ["SNOWFLAKE_DATABASE"],
        account=environ["SNOWFLAKE_ACCOUNT"],
        schema=environ["SNOWFLAKE_SCHEMA"],
        warehouse=environ["SNOWFLAKE_WAREHOUSE"],
    )
    engine = create_engine(url)
    connection = engine.connect()
    yield connection
    connection.close()


def _sanitize_datetimes(df: pd.DataFrame) -> pd.DataFrame:
    """Converts date columns to datetime objects"""
    for col in df.columns:
        if all(elem is None or isinstance(elem, date) for elem in df[col]):
            df[col] = pd.to_datetime(df[col])
    return df


@pytest.mark.parametrize("case_id, case_spec_file", retrieve_case("sql_translator", "snowflake_pypika"))
def test_snowflake_translator_pipeline(engine: Any, case_id: str, case_spec_file: str, available_variables: dict):
    pipeline_spec = get_spec_from_json_fixture(case_id, case_spec_file)

    steps = [{"name": "domain", "domain": "beers_tiny"}] + pipeline_spec["step"]["pipeline"]
    pipeline = PipelineWithVariables(steps=steps).render(
        available_variables, nosql_apply_parameters_to_query_with_errors
    )

    query = translate_pipeline(
        sql_dialect=SQLDialect.SNOWFLAKE,
        pipeline=pipeline,
        tables_columns={"beers_tiny": BEERS_TABLE_COLUMNS},
        db_schema=None,
    )
    expected = pd.read_json(StringIO(json.dumps(pipeline_spec["expected"])), orient="table")
    expected_rounded = expected.round(5)

    result: pd.DataFrame = pd.read_sql(text(query), engine)
    sanitized_result = _sanitize_datetimes(result)
    result_rounded = sanitized_result.round(5)

    assert_dataframes_equals(expected_rounded, result_rounded)
