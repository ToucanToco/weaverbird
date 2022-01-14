import json
import time
from os import environ
from random import randint
from typing import Dict, Optional, Union

import pandas as pd
import pytest
import snowflake.connector
from snowflake.connector import DictCursor
from snowflake.sqlalchemy import URL
from sqlalchemy import create_engine

from tests.utils import (
    assert_dataframes_equals,
    get_spec_from_json_fixture,
    retrieve_case,
    type_code_mapping,
)
from weaverbird.backends.pandas_executor.pipeline_executor import logger
from weaverbird.backends.sql_translator import translate_pipeline
from weaverbird.pipeline import Pipeline

test_cases = retrieve_case('sql_translator', 'snowflake')

ACCOUNT = 'toucantocopartner.west-europe.azure'
USER = 'toucan_test'
WAREHOUSE = 'toucan_test'
DATABASE = 'toucan_test'
ROLE = 'toucan_test'
SCHEMA = 'toucan_test'

SNOWFLAKE_TABLES_TESTS = []
# to be sure we're going to run the cleaner job only once per test
# we will need this boolean variable
CLEANER_JOB_DONE = False


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


def snowflake_query_describer(domain: str, query_string: str = None) -> Union[Dict[str, str], None]:
    connection = get_connection()
    with connection.cursor() as cursor:
        describe_res = cursor.describe(f'SELECT * FROM {domain}' if domain else query_string)
        res = {r.name: type_code_mapping.get(r.type_code) for r in describe_res}
        return res


def snowflake_query_executor(domain: str, query_string: str = None) -> Union[pd.DataFrame, None]:
    connection = get_connection()
    with connection.cursor() as cursor:
        cursor = connection.cursor(DictCursor)
        res = cursor.execute(domain if domain else query_string).fetchall()
        return pd.DataFrame(res)


def _drop_tables(table_array: list):
    """
    This method will drop tables
    As given parameter, we have list of tables we want to drop

    """
    global SNOWFLAKE_TABLES_TESTS

    logger.info("[x] Cleaning tables in progress, please wait...")
    # Drop created table
    for case_id in table_array:
        # The try catch just if we're droping an already drope table in the process
        try:
            logger.info(f"[-] Dropping {case_id}")

            execute(get_connection(), f'DROP TABLE {case_id};')
            # we remove from SNOWFLAKE_TABLES_TESTS the case test
            SNOWFLAKE_TABLES_TESTS.remove(
                case_id
            ) if case_id in SNOWFLAKE_TABLES_TESTS else logger.info(
                f"{case_id} not in the list anymore !"
            )
        except Exception as es:
            logger.info(f"[-]{es}\n[-] {case_id} was probably already dropped or not available !")


def clean_too_old_residuals_tables():
    """
    This function  will get the list of all available tables
    and then clean the too much old one by calculate the time of the creation of those tables

    """
    try:
        # we get table list from snowflake
        tables_list: pd.DataFrame = execute(get_connection(), "SHOW TABLES;")
        too_old_tables_to_delete: list = []

        # we loop on table's name of the database
        for table_name in tables_list["name"].to_list():
            if "_TOUCAN_TEST_" in table_name:
                created_table_time = int(table_name.split("___")[1])
                # if the table is too old (Was created 24 hour earlier)
                if time.time() - created_table_time > 86400:
                    too_old_tables_to_delete.append(table_name)

        # then we delete the list of residual tables:
        _drop_tables(too_old_tables_to_delete)
    except Exception as es:
        # in some case we can have an exception here for an empty result for table
        # no worries, not a big deal, that's why there is this error skip here
        logger.info(es)


# Translation from Pipeline json to SQL query
@pytest.mark.parametrize('case_id, case_spec_file_path', test_cases)
def test_sql_translator_pipeline(case_id, case_spec_file_path, get_engine):
    global SNOWFLAKE_TABLES_TESTS, CLEANER_JOB_DONE

    # To be sure to execute the cleaner job only once per tests
    if not CLEANER_JOB_DONE:
        # Let's clean some old residuals tables
        clean_too_old_residuals_tables()
        CLEANER_JOB_DONE = True

    # To prevent conflicts on snowflake tables when testing on multiple terminals
    # we're going to create specific tables for tests with this structure
    # tableName_creationTime_caseid (Ex: SUBSTRING_toucan_test___169494938___3342)
    # The _toucan_test_ is to prevent drop e2e tables because those tables will not have tha keyword
    case_id = (
        f"{case_id.replace('/', '')}_toucan_test___{str(int(time.time()))}___{str(randint(1, 100))}"
    )
    spec = get_spec_from_json_fixture(case_id, case_spec_file_path)
    try:
        # Drop created table
        execute(get_connection(), f'DROP TABLE IF EXISTS {case_id}', False)

        # We append tables we just created that will be cleaned at the end of tests
        SNOWFLAKE_TABLES_TESTS.append(case_id)

        # inserting the data in Snowflake
        # Take data in fixture file, set in pandas, create table and insert
        data_to_insert = pd.read_json(json.dumps(spec['input']), orient='table')
        data_to_insert.to_sql(
            name=case_id, con=get_engine, index=False, if_exists='replace', chunksize=1
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

        _drop_tables([case_id])
        if 'other_inputs' in spec:
            _drop_tables(spec['other_inputs'])

        # Compare result and expected (from fixture file)
        if 'expected_sql' in spec:
            result_expected: pd.DataFrame = pd.read_json(
                json.dumps(spec['expected_sql']), orient='table'
            )
        else:
            result_expected: pd.DataFrame = pd.read_json(
                json.dumps(spec['expected']), orient='table'
            )

        assert_dataframes_equals(result_expected, result)
    except KeyboardInterrupt as es:
        logger.info(es)
        # We try to kill residuals tables
        _drop_tables(SNOWFLAKE_TABLES_TESTS)
