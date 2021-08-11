import json
import logging
import time
from glob import glob
from os import path
from typing import List, Union, Dict

from docker.models.images import Image
import docker

import pymysql
pymysql.install_as_MySQLdb()
from sqlalchemy import create_engine
import pytest

import pandas as pd

from server.tests.utils import assert_dataframes_equals

from weaverbird.backends.sql_translator import translate_pipeline
from weaverbird.pipeline import Pipeline

image = {
    'name': 'mysql_weaverbird_test',
    'image': 'mysql',
    'version': 'latest'
}
docker_client = docker.from_env()
docker_container = None

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


@pytest.fixture(scope='module', autouse=True)
def toto():
    images: List[Image] = docker_client.images.list()
    found = False
    for i in images:
        if i.tags[0] == f'{image["image"]}:{image["version"]}':
            found = True
    if not found:
        logging.getLogger(__name__).info(f'Download docker image {image["image"]}:{image["version"]}')
        docker_client.images.pull('mysql:5.7.21')

    logging.getLogger(__name__).info(f'Start docker image {image["image"]}:{image["version"]}')
    global docker_container
    docker_container = docker_client.containers.run(
        image=f'{image["image"]}:{image["version"]}',
        name=f'{image["name"]}',
        auto_remove=True,
        detach=True,
        environment={
            'MYSQL_DATABASE': 'mysql_db',
            'MYSQL_ROOT_PASSWORD': 'ilovetoucan',
            'MYSQL_USER': 'ubuntu',
            'MYSQL_PASSWORD': 'ilovetoucan',
            'MYSQL_ROOT_HOST': '%'
        },
        ports={'3306': '3306'},
    )
    ready = False
    while not ready:
        time.sleep(1)
        try:
            if docker_container.status == 'created' and get_connection():
                ready = True
        except:
            pass
    yield docker_container
    docker_container.stop()

# Update this method to use snowflake connection
def get_connection():
    con_params = {
        'host': '127.0.0.1',
        'user': 'ubuntu',
        'password': 'ilovetoucan',
        'port': 3306,
        'database': 'mysql_db',
    }
    conn = pymysql.connect(**con_params)
    return conn


def get_engine():
    host = '127.0.0.1'
    user = 'ubuntu'
    password = 'ilovetoucan'
    port = 3306
    database = 'mysql_db'
    engine = create_engine(f'mysql://{user}:{password}@{host}:{port}/{database}')
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


def sql_query_describer(t) -> Union[Dict[str, str], None]:
    lst = t.split(" ")
    lst = [item for item in lst if len(item) > 0]
    temp = lst[lst.index("FROM") + 1]

    if len(temp.split('.')) == 2:
        table_name = temp.split('.')[1]
    else:
        table_name = temp.split('.')[0]

    request = f'SELECT column_name as name, data_type as type_code FROM information_schema.columns WHERE table_name = "{table_name}" ORDER BY ordinal_position;'
    connection = get_connection()
    with connection.cursor() as cursor:
        cursor.execute(request)
        describe_res = cursor.fetchall()
        res = {r[0]: r[1] for r in describe_res}
        return res


def snowflake_query_describer(t) -> Union[Dict[str, str], None]:
    connection = get_connection()
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
def test_sql_translator_pipeline(case_id, case_spec_file_path):
    spec_file = open(case_spec_file_path, 'r')
    spec = json.loads(spec_file.read())
    spec_file.close()

    # TODO - insert data from fixture.json
    data_to_insert = pd.read_json(json.dumps(spec['input']), orient='table')
    data_to_insert.to_sql(
        name=case_id.replace('/', ''),
        con=get_engine(),
        index=False,
        if_exists='replace',
    )

    steps = spec['step']['pipeline']
    steps.insert(0, {
        'name': 'domain',
        'domain': f'SELECT * FROM {case_id.replace("/", "")}'
    })
    pipeline = Pipeline(steps=steps)
    pandas_result_expected = pd.read_json(json.dumps(spec['expected']), orient='table')
    query_expected = spec['other_expected']['sql']['query']

    query, report = translate_pipeline(
        pipeline,
        sql_query_retriever=sql_retrieve_city,
        sql_query_describer=sql_query_describer  # replace by snowflake_query_describer
    )
    result = execute(get_connection(), query)
    assert query_expected == query

    assert_dataframes_equals(pandas_result_expected, result)
