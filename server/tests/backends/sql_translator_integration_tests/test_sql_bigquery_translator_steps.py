"""
BigQuery free DBs have tables that expire after 60 days.
If the table "beers.beers_tiny" is expired, re-create it:
- open the BigQuery console https://console.cloud.google.com/bigquery?project=biquery-integration-tests&ws=!1m4!1m3!3m2!1sbiquery-integration-tests!2sbeers
- use "create table", choose "Upload" and use the `beers-bigquery.csv` file available [here](https://github.com/ToucanToco/weaverbird/pull/1835#issuecomment-1647810149)
    - name the table "beers" and check "Edit text" for the schema
    - fill the schema with:
    ```
    price_per_l:FLOAT,
    alcohol_degree:FLOAT,
    name:STRING,
    cost:FLOAT,
    beer_kind:STRING,
    volume_ml:FLOAT,
    brewing_date:DATE,
    nullable_name:STRING
    ```
- run the query:
``
`CREATE TABLE `beers.beers_tiny` AS SELECT * FROM `beers.beers` ORDER BY brewing_date LIMIT 10
```
"""

import json
from io import StringIO
from os import environ

import pandas as pd
import pytest
from google.cloud.bigquery import Client
from google.oauth2 import service_account
from pandas.api.types import is_datetime64_any_dtype
from toucan_connectors.common import nosql_apply_parameters_to_query

from tests.utils import (
    _BEERS_TABLE_COLUMNS,
    assert_dataframes_equals,
    get_spec_from_json_fixture,
    retrieve_case,
)
from weaverbird.backends.pypika_translator.dialects import SQLDialect
from weaverbird.backends.pypika_translator.translate import translate_pipeline
from weaverbird.pipeline import PipelineWithVariables

credentials = service_account.Credentials.from_service_account_info(
    info=json.loads(environ["GOOGLE_BIG_QUERY_CREDENTIALS"])
)


@pytest.fixture
def bigquery_client() -> Client:
    return Client(credentials=credentials)


def _sanitize_df(df: pd.DataFrame) -> pd.DataFrame:
    # bigquery uses datetime64[ms] by default, whereas pandas.read_json uses ns precision, even when
    # specifying date_unit="ms" (must be caused by orient="table")
    for col, dtype in df.dtypes.items():
        if is_datetime64_any_dtype(df[col]) and getattr(dtype, "tz", None) is None:
            df[col] = df[col].astype("datetime64[ns]")
    return df


@pytest.mark.parametrize("case_id, case_spec_file", retrieve_case("sql_translator", "bigquery_pypika"))
def test_bigquery_translator_pipeline(
    bigquery_client: Client, case_id: str, case_spec_file: str, available_variables: dict
):
    pipeline_spec = get_spec_from_json_fixture(case_id, case_spec_file)

    if pipeline_spec["step"]["pipeline"][0]["name"] == "customsql":
        steps = pipeline_spec["step"]["pipeline"]
        table_columns = pipeline_spec["step"].get("table_columns", _BEERS_TABLE_COLUMNS)
    else:
        steps = [{"name": "domain", "domain": "beers_tiny"}] + pipeline_spec["step"]["pipeline"]
        table_columns = _BEERS_TABLE_COLUMNS

    pipeline = PipelineWithVariables(steps=steps).render(available_variables, nosql_apply_parameters_to_query)

    query = translate_pipeline(
        sql_dialect=SQLDialect.GOOGLEBIGQUERY,
        pipeline=pipeline,
        tables_columns={"beers_tiny": table_columns},
        db_schema="beers",
    )
    expected = pd.read_json(StringIO(json.dumps(pipeline_spec["expected"])), orient="table")
    result = bigquery_client.query(query).result().to_dataframe(date_dtype=None)
    sanitized_result = _sanitize_df(result)
    assert_dataframes_equals(expected, sanitized_result)
