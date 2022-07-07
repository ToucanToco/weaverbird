import json
import logging
import time
from os import path
from typing import List

import docker
import pandas as pd
import psycopg2
import pytest
from docker.models.images import Image
from psycopg2 import OperationalError
from sqlalchemy import create_engine

from tests.utils import (
    _BEERS_TABLE_COLUMNS,
    assert_dataframes_equals,
    get_spec_from_json_fixture,
    retrieve_case,
)
from weaverbird.backends.pypika_translator.dialects import SQLDialect
from weaverbird.backends.pypika_translator.translate import translate_pipeline
from weaverbird.pipeline import PipelineWithVariables

image = {'name': 'postgres_weaverbird_test', 'image': 'postgres', 'version': '14.1-bullseye'}
con_params = {
    'host': '127.0.0.1',
    'user': 'ubuntu',
    'password': 'ilovetoucan',
    'port': 5432,
    'database': 'pg_db',
}
docker_client = docker.from_env()
ENGINE = None


@pytest.fixture(scope='module', autouse=True)
def db_container():
    global ENGINE
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
    while not ENGINE:
        time.sleep(1)
        try:
            if docker_container.status == 'created' and psycopg2.connect(**con_params):
                ENGINE = create_engine(
                    f'postgresql://{con_params["user"]}:{con_params["password"]}@{con_params["host"]}:{con_params["port"]}/{con_params["database"]}'
                )
                dataset = pd.read_csv(
                    f'{path.join(path.dirname(path.realpath(__file__)))}/beers.csv'
                )
                dataset['brewing_date'] = dataset['brewing_date'].apply(pd.to_datetime)
                dataset.to_sql('beers_tiny', ENGINE)
        except OperationalError:
            pass
    yield docker_container
    docker_container.stop()


# Translation from Pipeline json to SQL query
@pytest.mark.parametrize(
    'case_id, case_spec_file_path', retrieve_case('sql_translator', 'postgres_pypika')
)
def test_sql_translator_pipeline(case_id, case_spec_file_path):
    spec = get_spec_from_json_fixture(case_id, case_spec_file_path)

    steps = spec['step']['pipeline']
    steps.insert(0, {'name': 'domain', 'domain': 'beers_tiny'})
    pipeline = PipelineWithVariables(steps=steps)

    # Convert Pipeline object to Postgres Query
    query = translate_pipeline(
        sql_dialect=SQLDialect.POSTGRES,
        pipeline=pipeline,
        tables_columns={'beers_tiny': _BEERS_TABLE_COLUMNS},
        db_schema=None,
    )
    # Execute request generated from Pipeline in Postgres and get the result
    result: pd.DataFrame = pd.read_sql(query, ENGINE)
    expected = pd.read_json(json.dumps(spec['expected']), orient='table')
    if 'other_expected' in spec:
        query_expected = spec['other_expected']['sql']['query']
        assert query_expected == query
    assert_dataframes_equals(expected, result)
