import json
import time
from os import environ
from random import randint
from typing import Any

import pandas as pd
import pytest
import redshift_connector
import sqlalchemy
from sqlalchemy.engine.url import URL

from tests.utils import assert_dataframes_equals, get_spec_from_json_fixture, retrieve_case
from weaverbird.backends.pandas_executor.pipeline_executor import logger
from weaverbird.backends.pypika_translator.dialects import SQLDialect
from weaverbird.backends.pypika_translator.translate import translate_pipeline
from weaverbird.pipeline import PipelineWithVariables

test_cases = retrieve_case('sql_translator', 'redshift')

HOST = 'toucan-paris.crxviwjnhzks.eu-west-3.redshift.amazonaws.com'
CLUSTER = 'toucan-paris'
USER = 'awsuser'
DATABASE = 'dev'
PASSWORD = environ.get('REDSHIFT_PASSWORD')
REGION = "eu-west-3"

PORT = 5439

REDSHIFT_TABLES_TESTS = []
REDSHIFT_CONNEXION = redshift_connector.connect(
    user=USER,
    database=DATABASE,
    host=HOST,
    cluster_identifier=CLUSTER,
    password=PASSWORD,
    region=REGION,
    ssl=False,
)
REDSHIFT_CONNEXION.autocommit = True


def _drop_tables(table_array: list) -> None:
    """
    This method will drop tables
    As given parameter, we have list of tables we want to drop

    """
    global REDSHIFT_TABLES_TESTS

    logger.info("[x] Cleaning tables in progress, please wait...")
    with REDSHIFT_CONNEXION.cursor() as curs:
        for case_id in table_array:
            try:
                logger.info(f"[-] Dropping {case_id}")
                curs.execute(f'DROP TABLE {case_id}')
                REDSHIFT_TABLES_TESTS.remove(
                    case_id
                ) if case_id in REDSHIFT_TABLES_TESTS else logger.info(
                    f"{case_id} not in the list anymore !"
                )
            except Exception as es:
                logger.info(
                    f"[-]{es}\n[-] {case_id} was probably already dropped or not available !"
                )


@pytest.fixture(scope='module', autouse=True)
def autodrop_tables():
    try:
        yield
    finally:
        _drop_tables(REDSHIFT_TABLES_TESTS)


# Translation from Pipeline json to SQL query
@pytest.mark.skip(reason='Currently unable to run it on CI :/')
@pytest.mark.parametrize('case_id, case_spec_file_path', test_cases)
def test_sql_translator_pipeline(case_id: str, case_spec_file_path: str) -> None:
    global REDSHIFT_TABLES_TESTS, CLEANER_JOB_DONE
    case_id = (
        f"{case_id.replace('/', '')}_toucan_test___{str(int(time.time()))}___{str(randint(1, 100))}"
    )
    spec = get_spec_from_json_fixture(case_id, case_spec_file_path)
    try:
        with REDSHIFT_CONNEXION.cursor() as curs:
            curs.execute(f'DROP TABLE IF EXISTS {case_id}')
        engine = sqlalchemy.create_engine(
            url=URL.create(
                drivername='redshift+redshift_connector',
                host=HOST,
                port=PORT,
                database=DATABASE,
                username=USER,
                password=PASSWORD,
            )
        )

        REDSHIFT_TABLES_TESTS.append(case_id)
        data_to_insert = pd.read_json(json.dumps(spec['input']), orient='table')
        data_to_insert.columns = [c.lower() for c in data_to_insert.columns]
        data_to_insert.to_sql(
            name=case_id, con=engine, index=False, if_exists='replace', chunksize=1
        )
        if 'other_inputs' in spec:
            for input in spec['other_inputs']:
                pd.read_json(json.dumps(spec['other_inputs'][input]), orient='table').to_sql(
                    name=input,
                    con=engine,
                    index=False,
                    if_exists='replace',
                )

        steps = spec['step']['pipeline']
        lower_step_columns(steps)
        steps.insert(0, {'name': 'domain', 'domain': case_id})
        pipeline = PipelineWithVariables(steps=steps)

        query = translate_pipeline(
            sql_dialect=SQLDialect.REDSHIFT,
            pipeline=pipeline,
            tables_columns={case_id: data_to_insert.columns},
            db_schema=None,
        )

        result = pd.read_sql(query, engine)
        _drop_tables([case_id])
        if 'other_inputs' in spec:
            _drop_tables(spec['other_inputs'])

        if 'expected_sql' in spec:
            result_expected: pd.DataFrame = pd.read_json(
                json.dumps(spec['expected_sql']), orient='table'
            )
        else:
            result_expected: pd.DataFrame = pd.read_json(
                json.dumps(spec['expected']), orient='table'
            )
        result_expected.columns = [c.lower() for c in result_expected.columns]
        assert_dataframes_equals(result_expected, result)
    except KeyboardInterrupt as es:
        logger.info(es)
        _drop_tables(REDSHIFT_TABLES_TESTS)


def lower_step_columns(steps: list[dict[str, Any]]) -> None:
    for s in steps:
        if 'columns' in s:
            if isinstance(s['columns'][0], dict):
                for d in s['columns']:
                    d['column'] = d['column'].lower()
            else:
                s['columns'] = [c.lower() for c in s['columns']]
        elif 'column' in s:
            s['column'] = s['column'].lower()
        elif 'search_column' in s:
            s['search_column'] = s['search_column'].lower()
        elif 'to_rename' in s:
            lowercased = []
            for sublist in s['to_rename']:
                lowercased.append([c.lower() for c in sublist])
            s['to_rename'] = lowercased
