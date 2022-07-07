import json
import logging
import time
from os import path
from typing import Any, List

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
connection_string = f'postgresql://{con_params["user"]}:{con_params["password"]}@{con_params["host"]}:{con_params["port"]}/{con_params["database"]}'


@pytest.fixture(scope='module')
def engine() -> Any:
    return create_engine(connection_string)


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
    engine = None
    while not engine:
        time.sleep(1)
        try:
            if docker_container.status == 'created' and psycopg2.connect(**con_params):
                dataset = pd.read_csv(
                    f'{path.join(path.dirname(path.realpath(__file__)))}/beers.csv'
                )
                dataset['brewing_date'] = dataset['brewing_date'].apply(pd.to_datetime)
                engine = create_engine(connection_string)
                dataset.to_sql('beers_tiny', engine)
        except OperationalError:
            pass
    try:
        yield docker_container
    finally:
        docker_container.kill()


# Translation from Pipeline json to SQL query
@pytest.mark.parametrize(
    'case_id, case_spec_file_path', retrieve_case('sql_translator', 'postgres_pypika')
)
def test_sql_translator_pipeline(case_id: str, case_spec_file_path: str, engine: Any):
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
    result: pd.DataFrame = pd.read_sql(query, engine)
    expected = pd.read_json(json.dumps(spec['expected']), orient='table')
    assert_dataframes_equals(expected, result)
