import json
from os import environ
from typing import Dict, NamedTuple, Optional, Union

import pandas as pd
import pytest
import snowflake.connector
from snowflake.connector import DictCursor
from snowflake.sqlalchemy import URL
from sqlalchemy import create_engine
from random import randint

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
    return f'SELECT * FROM {t}'


class TestDataSlice(NamedTuple):
    df: pd.DataFrame


def snowflake_query_describer(domain: str, query_string: str = None) -> Union[Dict[str, str], None]:
    connection = get_connection()
    with connection.cursor() as cursor:
        describe_res = cursor.describe(f'SELECT * FROM {domain}' if domain else query_string)
        res = {r.name: type_code_mapping.get(r.type_code) for r in describe_res}
        return res


def snowflake_query_executor(domain: str, query_string: str = None) -> Union[TestDataSlice, None]:
    connection = get_connection()
    with connection.cursor() as cursor:
        cursor = connection.cursor(DictCursor)
        res = cursor.execute(domain if domain else query_string).fetchall()
        return TestDataSlice(df=pd.DataFrame(res))


# Translation from Pipeline json to SQL query
@pytest.mark.parametrize('case_id, case_spec_file_path', test_cases)
def test_sql_translator_pipeline(case_id, case_spec_file_path, get_engine):
    # TO prevent conflict on snowflake tables when testing on multiple terminals
    case_id = case_id.replace("/", "") + str(randint(1, 100000))

    spec_file = open(case_spec_file_path, 'r')
    spec = json.loads(spec_file.read())
    spec_file.close()

    # Drop created table
    execute(get_connection(), f'DROP TABLE IF EXISTS {case_id}', False)

    # inserting the data in Snowflake
    # Take data in fixture file, set in pandas, create table and insert
    data_to_insert = pd.read_json(json.dumps(spec['input']), orient='table')
    data_to_insert.to_sql(
        name=case_id.replace('/', ''), con=get_engine, index=False, if_exists='replace', chunksize=1
    )

    if 'other_inputs' in spec:
        for input in spec['other_inputs']:
            pd.read_json(json.dumps(spec['other_inputs'][input]), orient='table').to_sql(
                name=input,
                con=get_engine,
                index=False,
                if_exists='replace',
            )

    steps = spec['step']['pipeline']
    steps.insert(0, {'name': 'domain', 'domain': case_id})
    pipeline = Pipeline(steps=steps)

    # Convert Pipeline object to Snowflake Query
    query, report = translate_pipeline(
        pipeline,
        sql_query_retriever=sql_retrieve_city,
        sql_query_describer=snowflake_query_describer,
        sql_query_executor=snowflake_query_executor,
    )

    # Execute request generated from Pipeline in Snowflake and get the result
    result: pd.DataFrame = execute(get_connection(), query)

    # Drop created table
    execute(get_connection(), f'DROP TABLE {case_id};')
    if 'other_inputs' in spec:
        for input in spec['other_inputs']:
            execute(get_connection(), f'DROP TABLE {input}')

    # Compare result and expected (from fixture file)
    if 'expected_sql' in spec:
        result_expected: pd.DataFrame = pd.read_json(
            json.dumps(spec['expected_sql']), orient='table'
        )
    else:
        result_expected: pd.DataFrame = pd.read_json(json.dumps(spec['expected']), orient='table')

    assert_dataframes_equals(result_expected, result)
