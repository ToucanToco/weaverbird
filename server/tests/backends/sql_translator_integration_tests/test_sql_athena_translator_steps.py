import json
from datetime import date
from io import StringIO
from os import environ

import awswrangler as wr
import pandas as pd
import pytest
from boto3 import Session

from tests.utils import assert_dataframes_equals, get_spec_from_json_fixture, retrieve_case
from weaverbird.backends.pypika_translator.dialects import SQLDialect
from weaverbird.backends.pypika_translator.translate import translate_pipeline
from weaverbird.pipeline import PipelineWithVariables
from weaverbird.utils.toucan_connectors import nosql_apply_parameters_to_query_with_errors

_REGION = environ["ATHENA_REGION"]
_DB = environ["ATHENA_DATABASE"]
_ACCESS_KEY_ID = environ["ATHENA_ACCESS_KEY_ID"]
_SECRET_ACCESS_KEY = environ["ATHENA_SECRET_ACCESS_KEY"]
_OUTPUT = environ["ATHENA_OUTPUT"]


@pytest.fixture
def boto_session() -> Session:
    return Session(
        aws_access_key_id=_ACCESS_KEY_ID,
        aws_secret_access_key=_SECRET_ACCESS_KEY,
        region_name=_REGION,
    )


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


def _sanitize_df(df: pd.DataFrame) -> pd.DataFrame:
    # Athena uses the native `date` type for DATE columns, whereas we need datetime64[ns]
    for col in df.columns:
        if all(isinstance(elem, date | None) for elem in df[col]):
            df[col] = df[col].astype("datetime64[ns]")
    return df


@pytest.mark.parametrize("case_id, case_spec_file", retrieve_case("sql_translator", "athena_pypika"))
def test_athena_translator_pipeline(
    boto_session: Session, case_id: str, case_spec_file: str, available_variables: dict
):
    pipeline_spec = get_spec_from_json_fixture(case_id, case_spec_file)

    steps = [{"name": "domain", "domain": "beers_tiny"}] + pipeline_spec["step"]["pipeline"]
    pipeline = PipelineWithVariables(steps=steps).render(
        available_variables, nosql_apply_parameters_to_query_with_errors
    )

    query = translate_pipeline(
        sql_dialect=SQLDialect.ATHENA,
        pipeline=pipeline,
        tables_columns={"beers_tiny": _BEERS_TABLE_COLUMNS},
        db_schema=None,
    )
    expected = pd.read_json(StringIO(json.dumps(pipeline_spec["expected"])), orient="table")
    result = wr.athena.read_sql_query(
        query, database=_DB, boto3_session=boto_session, s3_output=_OUTPUT, ctas_approach=False
    )
    sanitized_result = _sanitize_df(result)
    assert_dataframes_equals(expected, sanitized_result)
