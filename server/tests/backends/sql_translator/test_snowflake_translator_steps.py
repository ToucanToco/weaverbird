import json
from os import environ
from typing import Dict, Optional, Union

import pandas as pd
import pytest
import snowflake.connector
from snowflake.sqlalchemy import URL
from sqlalchemy import create_engine

from server.tests.utils import assert_dataframes_equals, retrieve_case, type_code_mapping
from weaverbird.backends.sql_translator import translate_pipeline
from weaverbird.pipeline import Pipeline

test_cases = retrieve_case('sql_translator', 'snowflake')

ACCOUNT = 'toucantocopartner.west-europe.azure'
USER = 'toucan_test'
WAREHOUSE = 'toucan_test'
DATABASE = 'toucan_test'
ROLE = 'toucan_test'
SCHEMA = 'toucan_test'


# Update this method to use snowflake connection
def get_connection():
    con_params = {
        'account': ACCOUNT,
        'user': USER,
        'password': environ.get('SNOWFLAKE_PASSWORD'),
        'warehouse': WAREHOUSE,
        'database': DATABASE,
        'role': ROLE,
        'schema': SCHEMA,
        'authenticator': 'snowflake',
    }
    return snowflake.connector.connect(**con_params)


@pytest.fixture
def get_engine():
    url = URL(
        account=ACCOUNT,
        user=USER,
        password=environ.get('SNOWFLAKE_PASSWORD'),
        warehouse=WAREHOUSE,
        database=DATABASE,
        role=ROLE,
        schema=SCHEMA,
        authenticator='snowflake',
    )
    engine = create_engine(url)
    return engine


def execute(connection, query: str, meta: bool = True) -> Optional[pd.DataFrame]:
    with connection.cursor() as cursor:
        cursor.execute(query)
        if meta:
            df = pd.DataFrame(cursor.fetchall())
            field_names = [i[0] for i in cursor.description]
            df.columns = field_names
            return df
        else:
            return None


def sql_retrieve_city(t):
    return t


def snowflake_query_describer(t) -> Union[Dict[str, str], None]:
    connection = get_connection()
    with connection.cursor() as cursor:
        describe_res = cursor.describe(t)
        res = {r.name: type_code_mapping.get(r.type_code) for r in describe_res}
        return res


# Translation from Pipeline json to SQL query
@pytest.mark.parametrize('case_id, case_spec_file_path', test_cases)
def test_sql_translator_pipeline(case_id, case_spec_file_path, get_engine):
    spec_file = open(case_spec_file_path, 'r')
    spec = json.loads(spec_file.read())
    spec_file.close()

    # Drop created table
    execute(get_connection(), f'DROP TABLE IF EXISTS {case_id.replace("/", "")}', False)

    # inserting the data in Snowflake
    # Take data in fixture file, set in pandas, create table and insert
    data_to_insert = pd.read_json(json.dumps(spec['input']), orient='table')
    data_to_insert.to_sql(
        name=case_id.replace('/', ''), con=get_engine, index=False, if_exists='replace', chunksize=1
    )

    steps = spec['step']['pipeline']
    steps.insert(0, {'name': 'domain', 'domain': f'SELECT * FROM {case_id.replace("/", "")}'})
    pipeline = Pipeline(steps=steps)

    # Convert Pipeline object to Snowflake Query
    query, report = translate_pipeline(
        pipeline,
        sql_query_retriever=sql_retrieve_city,
        sql_query_describer=snowflake_query_describer,
    )

    # Execute request generated from Pipeline in Snowflake and get the result
    result: pd.DataFrame = execute(get_connection(), query)

    # Drop created table
    execute(get_connection(), f'DROP TABLE {case_id.replace("/", "")}', False)

    # Compare result and expected (from fixture file)
    pandas_result_expected = pd.read_json(json.dumps(spec['expected']), orient='table')

    assert_dataframes_equals(pandas_result_expected, result)
