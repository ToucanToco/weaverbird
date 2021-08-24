import json
from glob import glob
from os import environ, path
from typing import Dict, Union

import pandas as pd
import pytest
import snowflake.connector
from snowflake.sqlalchemy import URL
from sqlalchemy import create_engine

from server.tests.utils import assert_dataframes_equals
from weaverbird.backends.sql_translator import translate_pipeline
from weaverbird.pipeline import Pipeline

fixtures_dir_path = path.join(path.dirname(path.realpath(__file__)), '../fixtures_sql')
step_cases_files = glob(path.join(fixtures_dir_path, '*/*.json'))

type_code_mapping = {
    0: 'int',
    1: 'float',
    2: 'str',
    3: 'date',
    4: 'timestamp',
    5: 'variant',
    6: 'timestamp_ltz',
    7: 'timestamp_tz',
    8: 'timestampe_ntz',
    9: 'object',
    10: 'array',
    11: 'binary',
    12: 'time',
    13: 'boolean',
}

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


def execute(connection, query: str):
    with connection.cursor() as cursor:
        cursor.execute(query)
        # result = cursor.fetchall()
        df = pd.DataFrame(cursor.fetchall())
        field_names = [i[0] for i in cursor.description]
        df.columns = field_names
        return df


def sql_retrieve_city(t):
    return t


def snowflake_query_describer(t) -> Union[Dict[str, str], None]:
    connection = get_connection()
    with connection.cursor() as cursor:
        describe_res = cursor.describe(t)
        res = {r.name: type_code_mapping.get(r.type_code) for r in describe_res}
        return res


test_cases = []
for x in step_cases_files:
    # Generate a readable id for each test case
    case_hierarchy = path.dirname(x)[len(fixtures_dir_path) :]
    case_name = path.splitext(path.basename(x))[0]
    case_id = case_hierarchy + '_' + case_name

    test_cases.append(pytest.param(case_id, x, id=case_id))


# Translation from Pipeline json to SQL query
@pytest.mark.parametrize('case_id, case_spec_file_path', test_cases)
def test_sql_translator_pipeline(case_id, case_spec_file_path, get_engine):
    spec_file = open(case_spec_file_path, 'r')
    spec = json.loads(spec_file.read())
    spec_file.close()

    # if the key snowflake is in 'other_expected', that means we should compute
    # the snowflake verification
    if 'snowflake' in spec['other_expected']:
        # inserting the data in MySQL
        # Take data in fixture file, set in pandas, create table and insert
        data_to_insert = pd.read_json(json.dumps(spec['input']), orient='table')
        data_to_insert.to_sql(
            name=case_id.replace('/', ''),
            con=get_engine,
            index=False,
            if_exists='replace',
        )

        steps = spec['step']['pipeline']
        steps.insert(0, {'name': 'domain', 'domain': f'SELECT * FROM {case_id.replace("/", "")}'})
        pipeline = Pipeline(steps=steps)

        # Convert Pipeline object to Snowflake Query
        query, report = translate_pipeline(
            pipeline,
            sql_query_retriever=sql_retrieve_city,
            sql_query_describer=snowflake_query_describer,  # replace by snowflake_query_describer
        )

        # Execute request generated from Pipeline in Snowflake and get the result
        result: pd.DataFrame = execute(get_connection(), query)
        result.columns = [c.upper() for c in result.columns]

        # Drop created table
        execute(get_connection(), f'DROP TABLE {case_id.replace("/", "")};')

        # Compare result and expected (from fixture file)
        pandas_result_expected = pd.read_json(json.dumps(spec['expected']), orient='table')
        query_expected = spec['other_expected']['snowflake']['query']
        assert query_expected == query

        assert_dataframes_equals(pandas_result_expected, result)
