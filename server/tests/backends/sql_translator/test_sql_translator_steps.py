# import json
from typing import Union, Dict
from glob import glob
from os import path

import pymysql
import pytest

import json
import pandas as pd

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


# Update this method to use snowflake connection
def connect():
    conv = pymysql.converters.conversions.copy()
    conv[246] = float
    con_params = {
        'host': '127.0.0.1',
        'user': 'ubuntu',
        'password': 'ilovetoucan',
        'port': 3306,  # mysql_server['port'],
        'database': 'mysql_db',
        'charset': 'utf8mb4',
        'conv': conv,
        'cursorclass': pymysql.cursors.DictCursor,
    }
    conn = pymysql.connect(**con_params)
    return conn


@pytest.fixture(scope='module')
def mysql_server(service_container):
    def check(host_port):
        conn = pymysql.connect(host='127.0.0.1', port=3306, user='ubuntu', password='ilovetoucan')
        cur = conn.cursor()
        cur.execute('SELECT 1;')
        cur.close()
        conn.close()

    return service_container('mysql', check, pymysql.Error)


@pytest.fixture
def mysql_connector(mysql_server):
    return connect()


def execute(connection, query: str):
    with connection.cursor() as cursor:
        cursor.execute(query)
        return cursor.fetchall()


def sql_retrieve_city(t):
    return t


def sql_query_describer(t) -> Union[Dict[str, str], None]:
    lst = t.split(" ")
    lst = [item for item in lst if len(item) > 0]
    temp = lst[lst.index("FROM") + 1]

    if len(temp.split('.')) == 2:
        table_name = temp.split('.')[1]
    else:
        table_name = temp.split('.')[0]

    request = f'SELECT column_name as name, data_type as type_code FROM information_schema.columns WHERE table_name = "{table_name}" ORDER BY ordinal_position;'

    connection = connect()
    with connection.cursor() as cursor:
        cursor.execute(request)
        describe_res = cursor.fetchall()
        res = {r['name']: r['type_code'] for r in describe_res}
        return res


def snowflake_query_describer(t) -> Union[Dict[str, str], None]:
    connection = connect()
    with connection.cursor() as cursor:
        describe_res = cursor.describe(t)
        res = {r.name: type_code_mapping.get(r.type_code) for r in describe_res}
        return res


test_cases = []
for x in step_cases_files:
    # Generate a readable id for each test case
    case_hierarchy = path.dirname(x)[len(fixtures_dir_path):]
    case_name = path.splitext(path.basename(x))[0]
    case_id = case_hierarchy + '_' + case_name

    test_cases.append(pytest.param(case_id, x, id=case_id))


# Translation from Pipeline json to SQL query
@pytest.mark.parametrize('case_id,case_spec_file_path', test_cases)
def test_sql_translator_pipeline(case_id, case_spec_file_path, mysql_connector):
    spec_file = open(case_spec_file_path, 'r')
    spec = json.loads(spec_file.read())
    spec_file.close()

    pipeline = Pipeline(steps=spec['step']['pipeline'])
    pandas_result_expected = pd.DataFrame.from_dict(spec['output']['sql']['result'])
    query_expected = spec['output']['sql']['query']

    query, report = translate_pipeline(
        pipeline,
        sql_query_retriever=sql_retrieve_city,
        sql_query_describer=sql_query_describer  # replace by snowflake_query_describer
    )
    sql_result = execute(mysql_connector, query)
    assert query_expected == query
    result = pd.DataFrame.from_dict(sql_result)
    assert_dataframes_equals(pandas_result_expected, result)


# Translation and execute from ...
def test_sql_translator_execute():
    ...
