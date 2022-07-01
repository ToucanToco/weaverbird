import json
from os import environ

import pandas as pd
import pytest
import redshift_connector
from redshift_connector.core import Connection

from tests.utils import assert_dataframes_equals, get_spec_from_json_fixture, retrieve_case
from weaverbird.backends.pypika_translator.dialects import SQLDialect
from weaverbird.backends.pypika_translator.translate import translate_pipeline
from weaverbird.pipeline import Pipeline

_HOST = 'toucan-paris.crxviwjnhzks.eu-west-3.redshift.amazonaws.com'
_CLUSTER = 'toucan-paris'
_USER = 'awsuser'
_DATABASE = 'dev'
_PASSWORD = environ.get('REDSHIFT_PASSWORD')
_REGION = "eu-west-3"
_PORT = 5439


@pytest.fixture
def redshift_connection() -> Connection:
    with redshift_connector.connect(
        user=_USER,
        database=_DATABASE,
        host=_HOST,
        cluster_identifier=_CLUSTER,
        password=_PASSWORD,
        region=_REGION,
        port=_PORT,
        ssl=False,
    ) as connection:
        connection.autocommit = True

    return connection


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


@pytest.mark.skip(reason='Currently unable to run it on CI :/')
@pytest.mark.parametrize(
    'case_id, case_spec_file', retrieve_case('sql_translator', 'redshift_pypika')
)
def test_redshift_translator_pipeline(
    redshift_connection: Connection, case_id: str, case_spec_file: str
):
    pipeline_spec = get_spec_from_json_fixture(case_id, case_spec_file)

    steps = [{'name': 'domain', 'domain': 'beers_tiny'}] + pipeline_spec['step']['pipeline']
    pipeline = Pipeline(steps=steps)

    query = translate_pipeline(
        sql_dialect=SQLDialect.REDSHIFT,
        pipeline=pipeline,
        tables_columns={'beers_tiny': _BEERS_TABLE_COLUMNS},
        db_schema='beers',
    )
    expected = pd.read_json(json.dumps(pipeline_spec['expected']), orient='table')

    with redshift_connection.cursor() as cursor:
        cursor.execute(query)
        result: pd.DataFrame = cursor.fetch_dataframe()

    assert_dataframes_equals(expected, result)
