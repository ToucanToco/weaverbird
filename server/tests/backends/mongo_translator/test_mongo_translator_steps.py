import datetime
import socket
import uuid

import docker
import pandas as pd
import pytest
from pymongo import MongoClient

from tests.utils import assert_dataframes_equals, get_spec_from_json_fixture, retrieve_case
from weaverbird.backends.mongo_translator.mongo_pipeline_translator import translate_pipeline
from weaverbird.pipeline import Pipeline

test_cases = retrieve_case('mongo_translator', 'mongo')


def unused_port():
    """find an unused TCP port and return it"""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind(('127.0.0.1', 0))
        return s.getsockname()[1]


@pytest.fixture(scope='session')
def mongo_version():
    return '5'


@pytest.fixture(scope='session')
def mongo_server_port(mongo_version):
    port = unused_port()
    docker_client = docker.from_env()
    container = docker_client.containers.run(
        f'mongo:{mongo_version}', ports={'27017': port}, auto_remove=True, detach=True
    )
    yield port
    container.kill()


@pytest.fixture()
def mongo_collection(mongo_server_port):
    collection_name = uuid.uuid4().hex
    client = MongoClient('localhost', mongo_server_port)
    return client['tests'][collection_name]


def cast_to_schema(param: dict) -> list:
    schema = {field['name']: field['type'] for field in param['schema']['fields']}
    data = param['data']
    casted_data = []
    for row in data:
        casted_row = {}
        for key, value in row.items():
            if schema[key] == 'datetime':
                casted_row[key] = datetime.datetime.fromisoformat(value)
            else:
                casted_row[key] = value
        casted_data.append(casted_row)
    return casted_data


@pytest.mark.parametrize('case_id,case_spec_file_path', test_cases)
def test_mongo_translator_pipeline(mongo_collection, case_id, case_spec_file_path):

    # insert in mongoDB
    spec = get_spec_from_json_fixture(case_id, case_spec_file_path)
    data = cast_to_schema(spec['input'])
    mongo_collection.insert_many(data)

    # create query
    steps = spec['step']['pipeline']
    pipeline = Pipeline(steps=steps)
    query = translate_pipeline(pipeline)

    # execute query
    result = list(mongo_collection.aggregate(*query))
    df = pd.DataFrame(result)
    if '_id' in df:
        df.drop('_id', axis=1, inplace=True)
    expected_df = pd.DataFrame(cast_to_schema(spec['expected']))
    assert_dataframes_equals(df, expected_df)
