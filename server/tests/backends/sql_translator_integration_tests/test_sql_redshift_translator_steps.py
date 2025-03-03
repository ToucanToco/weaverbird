import json
from collections.abc import Iterable
from io import StringIO
from os import environ

import pandas as pd
import pytest
import redshift_connector
from tenacity import retry, stop_after_attempt, wait_fixed

from tests.utils import assert_dataframes_equals, get_spec_from_json_fixture, retrieve_case
from weaverbird.backends.pypika_translator.dialects import SQLDialect
from weaverbird.backends.pypika_translator.translate import translate_pipeline
from weaverbird.pipeline import PipelineWithVariables
from weaverbird.utils.toucan_connectors import nosql_apply_parameters_to_query_with_errors

_HOST = environ["REDSHIFT_HOST"]
_USER = environ["REDSHIFT_USER"]
_DATABASE = environ["REDSHIFT_DATABASE"]
_PASSWORD = environ["REDSHIFT_PASSWORD"]
_PORT = 5439


@retry(stop=stop_after_attempt(5), wait=wait_fixed(5))
def _create_connection() -> redshift_connector.Connection:
    return redshift_connector.connect(user=_USER, password=_PASSWORD, host=_HOST, database=_DATABASE, port=_PORT)


@pytest.fixture(scope="module")
def cursor() -> Iterable[redshift_connector.Cursor]:
    with _create_connection().cursor() as conn:
        yield conn


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


@pytest.mark.parametrize("case_id, case_spec_file", retrieve_case("sql_translator", "redshift_pypika"))
def test_redshift_translator_pipeline(
    cursor: redshift_connector.Cursor, case_id: str, case_spec_file: str, available_variables: dict
):
    pipeline_spec = get_spec_from_json_fixture(case_id, case_spec_file)

    steps = [{"name": "domain", "domain": "beers_tiny"}] + pipeline_spec["step"]["pipeline"]
    pipeline = PipelineWithVariables(steps=steps).render(
        available_variables, nosql_apply_parameters_to_query_with_errors
    )

    query = translate_pipeline(
        sql_dialect=SQLDialect.REDSHIFT,
        pipeline=pipeline,
        tables_columns={"beers_tiny": _BEERS_TABLE_COLUMNS},
        db_schema=None,
    )
    expected = pd.read_json(StringIO(json.dumps(pipeline_spec["expected"])), orient="table")
    cursor.execute(query)
    result: pd.DataFrame = cursor.fetch_dataframe()
    assert_dataframes_equals(expected, result)
