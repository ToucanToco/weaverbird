import socket
import uuid

import docker
import pandas as pd
import pytest
from pymongo import MongoClient

from tests.utils import assert_dataframes_equals, get_spec_from_json_fixture, retrieve_case
from weaverbird.backends.mongo_translator.mongo_pipeline_translator import translate_pipeline
from weaverbird.pipeline import Pipeline

test_cases = retrieve_case('pandas_executor', 'pandas')


def unused_port():
    """find an unused TCP port and return it"""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind(('127.0.0.1', 0))
        return s.getsockname()[1]


@pytest.fixture()
def mongo_collection():
    port = unused_port()
    docker_client = docker.from_env()
    _ = docker_client.containers.run(
        'mongo:4.4.5', ports={'27017': port}, auto_remove=True, detach=True
    )

    collection_name = uuid.uuid4().hex
    client = MongoClient('localhost', port)
    return client['tests'][collection_name]


# @pytest.skip('MongoDB is not (yet) supported')
@pytest.mark.parametrize('case_id,case_spec_file_path', test_cases)
def test_mongo_translator_pipeline(mongo_collection, case_id, case_spec_file_path):
    spec = get_spec_from_json_fixture(case_id, case_spec_file_path)

    data = spec['input']['data']
    mongo_collection.insert_many(data)

    steps = spec['step']['pipeline']

    pipeline = Pipeline(steps=steps)
    query = translate_pipeline(pipeline)
    print(query)

    result = list(mongo_collection.aggregate(*query))
    df = pd.DataFrame(result)
    del df['_id']
    expected_df = pd.DataFrame(spec['expected']['data'])
    assert_dataframes_equals(df, expected_df)
