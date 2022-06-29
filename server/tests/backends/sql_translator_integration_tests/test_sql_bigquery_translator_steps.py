import json
from os import environ

import pandas as pd
import pytest
from google.cloud.bigquery import Client
from google.oauth2 import service_account

from tests.utils import assert_dataframes_equals, get_spec_from_json_fixture, retrieve_case
from weaverbird.backends.pypika_translator.dialects import SQLDialect
from weaverbird.backends.pypika_translator.translate import translate_pipeline
from weaverbird.pipeline import Pipeline

credentials = service_account.Credentials.from_service_account_info(
    info=json.loads(environ['GOOGLE_BIG_QUERY_CREDENTIALS'])
)


@pytest.fixture
def bigquery_client() -> Client:
    return Client(credentials=credentials)


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
    'case_id, case_spec_file', retrieve_case('sql_translator', 'bigquery_pypika')
)
def test_bigquery_translator_pipeline(bigquery_client: Client, case_id: str, case_spec_file: str):
    pipeline_spec = get_spec_from_json_fixture(case_id, case_spec_file)

    steps = [{'name': 'domain', 'domain': 'beers_tiny'}] + pipeline_spec['step']['pipeline']
    pipeline = Pipeline(steps=steps)

    query = translate_pipeline(
        sql_dialect=SQLDialect.GOOGLEBIGQUERY,
        pipeline=pipeline,
        tables_columns={'beers_tiny': _BEERS_TABLE_COLUMNS},
        db_schema='beers',
    )
    expected = pd.read_json(json.dumps(pipeline_spec['expected']), orient='table')
    result = bigquery_client.query(query).result().to_dataframe()
    assert_dataframes_equals(expected, result)
