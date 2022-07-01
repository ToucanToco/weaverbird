import json
import logging
import time
from typing import List, Optional

import docker
import pandas as pd
import psycopg2
import pytest
from docker.models.images import Image
from psycopg2 import OperationalError
from sqlalchemy import create_engine

from tests.backends.sql_translator.common import standardized_columns, standardized_values
from tests.utils import assert_dataframes_equals, get_spec_from_json_fixture, retrieve_case
from weaverbird.backends.pypika_translator.dialects import SQLDialect
from weaverbird.backends.pypika_translator.translate import translate_pipeline
from weaverbird.pipeline import PipelineWithVariables

image = {'name': 'postgres_weaverbird_test', 'image': 'postgres', 'version': '14.1-bullseye'}
docker_client = docker.from_env()
exec_type = 'postgres_pypika'

test_cases = retrieve_case('sql_translator', exec_type)


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
            'POSTGRES_DB': 'pg_db',
            'POSTGRES_USER': 'ubuntu',
            'POSTGRES_PASSWORD': 'ilovetoucan',
        },
        ports={'5432': '5432'},
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
        'port': 5432,
        'database': 'pg_db',
    }
    conn = psycopg2.connect(**con_params)
    return conn


@pytest.fixture
def get_engine():
    host = '127.0.0.1'
    user = 'ubuntu'
    password = 'ilovetoucan'
    port = 5432
    database = 'pg_db'
    engine = create_engine(f'postgresql://{user}:{password}@{host}:{port}/{database}')
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


# Translation from Pipeline json to SQL query
@pytest.mark.parametrize('case_id, case_spec_file_path', test_cases)
def test_sql_translator_pipeline(case_id, case_spec_file_path, get_engine):
    spec = get_spec_from_json_fixture(case_id, case_spec_file_path)
    test_table_name = case_id.replace("/", "")

    # Drop created table
    execute(get_connection(), f'DROP TABLE IF EXISTS {test_table_name}', False)

    # inserting the data in Postgres
    # Take data in fixture file, set in pandas, create table and insert
    data_to_insert = pd.read_json(json.dumps(spec['input']), orient='table')
    standardized_columns(data_to_insert)
    data_to_insert.to_sql(
        name=case_id.replace('/', ''), con=get_engine, index=False, if_exists='replace', chunksize=1
    )

    if 'other_inputs' in spec:
        for input in spec['other_inputs']:
            data_other_insert = pd.read_json(
                json.dumps(spec['other_inputs'][input]), orient='table'
            )
            standardized_columns(data_other_insert)
            data_other_insert.to_sql(
                name=input,
                con=get_engine,
                index=False,
                if_exists='replace',
            )

    steps = spec['step']['pipeline']
    steps.insert(0, {'name': 'domain', 'domain': test_table_name})
    pipeline = PipelineWithVariables(steps=steps)

    # Convert Pipeline object to Postgres Query
    query = translate_pipeline(
        sql_dialect=SQLDialect.POSTGRES,
        pipeline=pipeline,
        tables_columns={test_table_name: data_to_insert.columns},
        db_schema=None,
    )
    # Execute request generated from Pipeline in Postgres and get the result
    result: pd.DataFrame = execute(get_connection(), query)

    # we standadize the expected columns
    standardized_columns(result)

    # we standardize the expected values
    standardized_values(result)

    # Compare result and expected (from fixture file)
    pandas_result_expected = pd.read_json(
        json.dumps(
            spec[
                f'expected_{exec_type}'
                if f'expected_{exec_type}' in spec
                else 'expected_sql'
                if 'expected_sql' in spec
                else 'expected'
            ]
        ),
        orient='table',
    )

    standardized_columns(pandas_result_expected)
    standardized_values(pandas_result_expected, convert_nan_to_none=True)
    if 'other_expected' in spec:
        query_expected = spec['other_expected']['sql']['query']
        assert query_expected == query
    assert_dataframes_equals(pandas_result_expected, result)
