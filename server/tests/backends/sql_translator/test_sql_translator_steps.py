import json
import logging
import time
from typing import Dict, List, Optional, Union

import docker
import pandas as pd
import pymysql
import pytest
from docker.models.images import Image
from pymysql.err import OperationalError
from sqlalchemy import create_engine

from tests.utils import assert_dataframes_equals, get_spec_from_json_fixture, retrieve_case
from weaverbird.backends.sql_translator import translate_pipeline
from weaverbird.pipeline import Pipeline

pymysql.install_as_MySQLdb()

image = {'name': 'mysql_weaverbird_test', 'image': 'mysql', 'version': '5.7.21'}
docker_client = docker.from_env()

test_cases = retrieve_case('sql_translator', 'sql')


@pytest.fixture(scope='module', autouse=True)
def db_container():
    images: List[Image] = docker_client.images.list()
    found = False
    for i in images:
        try:
            if i.tags[0] == f'{image["image"]}:{image["version"]}':
                found = True
        except IndexError:
            pass
    if not found:
        logging.getLogger(__name__).info(
            f'Download docker image {image["image"]}:{image["version"]}'
        )
        docker_client.images.pull(f'{image["image"]}:{image["version"]}')

    logging.getLogger(__name__).info(f'Start docker image {image["image"]}:{image["version"]}')
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
            'MYSQL_ROOT_HOST': '%',
        },
        ports={'3306': '3306'},
    )
    ready = False
    while not ready:
        time.sleep(1)
        try:
            if docker_container.status == 'created' and get_connection():
                ready = True
        except OperationalError:
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


@pytest.fixture
def get_engine():
    host = '127.0.0.1'
    user = 'ubuntu'
    password = 'ilovetoucan'
    port = 3306
    database = 'mysql_db'
    engine = create_engine(f'mysql://{user}:{password}@{host}:{port}/{database}')
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


def sql_query_describer(domain, query_string=None) -> Union[Dict[str, str], None]:
    if domain:
        lst = domain.split(' ')
        lst = [item for item in lst if len(item) > 0]
        temp = lst[lst.index('FROM') + 1]

        if len(temp.split('.')) == 2:
            table_name = temp.split('.')[1]
        else:
            table_name = temp.split('.')[0]

    request = (
        f'SELECT column_name as name, data_type as type_code FROM information_schema.columns'
        f' WHERE table_name = "{table_name}" ORDER BY ordinal_position;'
    )

    connection = get_connection()
    with connection.cursor() as cursor:
        cursor.execute(request)
        describe_res = cursor.fetchall()
        res = {r[0]: r[1] for r in describe_res}
        return res


# Translation from Pipeline json to SQL query
@pytest.mark.parametrize('case_id, case_spec_file_path', test_cases)
def test_sql_translator_pipeline(case_id, case_spec_file_path, get_engine):
    spec = get_spec_from_json_fixture(case_id, case_spec_file_path)

    # Drop created table
    execute(get_connection(), f'DROP TABLE IF EXISTS {case_id.replace("/", "")}', False)

    # inserting the data in MySQL
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
    steps.insert(0, {'name': 'domain', 'domain': f'SELECT * FROM {case_id.replace("/", "")}'})
    pipeline = Pipeline(steps=steps)

    # Convert Pipeline object to MySQL Query
    query, report = translate_pipeline(
        pipeline,
        sql_query_retriever=sql_retrieve_city,
        sql_query_describer=sql_query_describer,
    )

    # Execute request generated from Pipeline in Mysql and get the result
    result: pd.DataFrame = execute(get_connection(), query)

    # Drop created table
    execute(get_connection(), f'DROP TABLE {case_id.replace("/", "")}', False)

    # Compare result and expected (from fixture file)
    pandas_result_expected = pd.read_json(json.dumps(spec['expected']), orient='table')
    if 'other_expected' in spec:
        query_expected = spec['other_expected']['sql']['query']
        assert query_expected == query

    assert_dataframes_equals(pandas_result_expected, result)
