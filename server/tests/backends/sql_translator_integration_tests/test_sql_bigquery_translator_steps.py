import json
from os import environ

"""
BigQuery free DBs have tables that expire after 60 days.
If the table "beers.beers_tiny" is expired, re-create it:
- open the BigQuery console https://console.cloud.google.com/bigquery?project=biquery-integration-tests&ws=!1m4!1m3!3m2!1sbiquery-integration-tests!2sbeers
- use "create table", choose "Upload" and use beers.csv
- name the table "beers_tiny" and check "Autodetect" for the scema 
"""


import pandas as pd
import pytest
from google.cloud.bigquery import Client
from google.oauth2 import service_account
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


@pytest.mark.parametrize(
    "case_id, case_spec_file", retrieve_case("sql_translator", "bigquery_pypika")
)
def test_bigquery_translator_pipeline(
    bigquery_client: Client, case_id: str, case_spec_file: str, available_variables: dict
):
    pipeline_spec = get_spec_from_json_fixture(case_id, case_spec_file)

    steps = [{"name": "domain", "domain": "beers_tiny"}] + pipeline_spec["step"]["pipeline"]
    pipeline = PipelineWithVariables(steps=steps).render(
        available_variables, nosql_apply_parameters_to_query
    )

    query = translate_pipeline(
        sql_dialect=SQLDialect.GOOGLEBIGQUERY,
        pipeline=pipeline,
        tables_columns={"beers_tiny": _BEERS_TABLE_COLUMNS},
        db_schema="beers",
    )
    expected = pd.read_json(json.dumps(pipeline_spec["expected"]), orient="table")
    result = bigquery_client.query(query).result().to_dataframe()
    assert_dataframes_equals(expected, result)
