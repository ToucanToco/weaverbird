# import json
from glob import glob
from os import path

import pymysql
import pytest

from weaverbird.backends.sql_translator import translate_pipeline
from weaverbird.pipeline import Pipeline

fixtures_dir_path = path.join(path.dirname(path.realpath(__file__)), '../fixtures')
step_cases_files = glob(path.join(fixtures_dir_path, '*/*.json'))


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
    conv = pymysql.converters.conversions.copy()
    conv[246] = float
    con_params = {
        'host': '127.0.0.1',
        'user': 'ubuntu',
        'password': 'ilovetoucan',
        'port': 3306,  # mysql_server['port'],
        'database': 'mysql_db',
        'charset': 'utf8mb4',
        # 'connect_timeout': self.connect_timeout,
        'conv': conv,
        'cursorclass': pymysql.cursors.DictCursor,
    }
    conn = pymysql.connect(**con_params)
    return conn


def execute(connection, query: str):
    print(connection)
    print(query)
    with connection.cursor() as cursor:
        cursor.execute(query)
        return cursor.fetchall()


def sql_retrieve_city(t):
    return 'SELECT * FROM City'


test_cases = []
for x in step_cases_files:
    # Generate a readable id for each test case
    case_hierarchy = path.dirname(x)[len(fixtures_dir_path) :]
    case_name = path.splitext(path.basename(x))[0]
    case_id = case_hierarchy + '_' + case_name

    test_cases.append(pytest.param(case_id, x, id=case_id))


# Translation from Pipeline json to SQL query
@pytest.mark.parametrize('case_id,case_spec_file_path', test_cases)
def test_sql_translator_pipeline(case_id, case_spec_file_path, mysql_connector):
    # spec_file = open(case_spec_file_path, 'r')
    # spec = json.loads(spec_file.read())
    # spec_file.close()

    # test = json.dumps(spec['input'])
    # pipeline = Pipeline(steps=[{'name': 'domain', 'domain': 'in'}, spec['step']])
    pipeline = Pipeline(
        steps=[
            {'name': 'domain', 'domain': 'domain_a'},
            {
                'name': 'filter',
                'condition': {'column': 'CountryCode', 'operator': 'eq', 'value': 'FRA'},
            },
        ]
    )
    query, report = translate_pipeline(pipeline, sql_query_retriever=sql_retrieve_city)
    print(query)
    result = execute(mysql_connector, query)
    print(result)

    # df_in = pd.read_json(json.dumps(spec['input']), orient='table')
    # df_out = pd.read_json(json.dumps(spec['expected']), orient='table')
    # dfs_in_others = {
    #     k: pd.read_json(json.dumps(v), orient='table')
    #     for (k, v) in spec.get('other_inputs', {}).items()
    # }
    #
    # pipeline = Pipeline(steps=[{'name': 'domain', 'domain': 'in'}, spec['step']])
    # DOMAINS = {'in': df_in, **dfs_in_others}
    # result = execute_pipeline(pipeline, domain_retriever=lambda x: DOMAINS[x])[0]
    #
    # assert_dataframes_equals(df_out, result)


# Translation and execute from ...
def test_sql_translator_execute():
    ...
