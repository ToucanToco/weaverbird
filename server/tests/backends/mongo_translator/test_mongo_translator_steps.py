import json
import socket
import uuid

import docker
import pandas as pd
import pytest
from pandas.api.types import is_datetime64_any_dtype, is_numeric_dtype
from pymongo import MongoClient

from tests.utils import assert_dataframes_content_equals, get_spec_from_json_fixture, retrieve_case
from weaverbird.backends.mongo_translator.mongo_pipeline_translator import translate_pipeline
from weaverbird.pipeline import Pipeline

exec_type = 'mongo'
test_cases = retrieve_case('mongo_translator', exec_type)


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
def mongo_database(mongo_server_port):
    client = MongoClient('localhost', mongo_server_port)
    return client['tests']


def _sanitize_df(df: pd.DataFrame) -> pd.DataFrame:
    non_numeric_cols = [col for col, dtype in df.dtypes.iteritems() if not is_numeric_dtype(dtype)]
    # Ensure we have None for non-numeric columns such as datetiems or
    # strings, rather than NaT or NaN (for strings)
    for col in non_numeric_cols:
        if is_datetime64_any_dtype(df[col]):
            # Mongo client is not tz-aware, so we make the objects
            # naive here
            df[col] = df[col].dt.tz_localize(None)
        df[col] = df[col].astype('object').where(pd.notna(df[col]), None)

    return df


def _sanitized_df_from_pandas_table(df_spec: dict) -> pd.DataFrame:
    df = _sanitize_df(pd.read_json(json.dumps(df_spec), orient='table'))
    bool_cols = [f['name'] for f in df_spec['schema']['fields'] if f['type'] == 'boolean']
    # By default, pandas converts null bools to False. This enforces
    # use of nullable booleans
    for col in bool_cols:
        df[col] = pd.Series((record[col] for record in df_spec['data']), dtype='boolean')

    return df


@pytest.mark.parametrize('case_id,case_spec_file_path', test_cases)
def test_mongo_translator_pipeline(mongo_database, case_id, case_spec_file_path):
    # insert in mongoDB
    collection_uid = uuid.uuid4().hex
    spec = get_spec_from_json_fixture(case_id, case_spec_file_path)
    data = _sanitized_df_from_pandas_table(spec['input']).to_dict(orient='records')
    mongo_database[collection_uid].insert_many(data)
    if 'other_inputs' in spec and (
        'join' in case_id or 'append' in case_id
    ):  # needed for join & append steps tests as we need a != collection
        [
            mongo_database[k].insert_many(
                pd.read_json(json.dumps(v), orient='table').to_dict(orient='records')
            )
            for k, v in spec.get('other_inputs', {}).items()
        ]

    # create query
    steps = spec['step']['pipeline']
    pipeline = Pipeline(steps=steps)
    query = translate_pipeline(pipeline)
    # execute query
    result = list(mongo_database[collection_uid].aggregate(query))
    df = _sanitize_df(pd.DataFrame(result))
    if '_id' in df:
        df.drop('_id', axis=1, inplace=True)
    expected_df = _sanitized_df_from_pandas_table(
        spec[f'expected_{exec_type}' if f'expected_{exec_type}' in spec else 'expected']
    )

    assert_dataframes_content_equals(df, expected_df)
