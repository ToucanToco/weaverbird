import json
import socket
import uuid
from io import StringIO

import docker
import pandas as pd
import pytest
from pandas.api.types import is_bool_dtype, is_datetime64_any_dtype, is_numeric_dtype
from pymongo import MongoClient

from tests.utils import assert_dataframes_content_equals, get_spec_from_json_fixture, retrieve_case
from weaverbird.backends.mongo_translator.mongo_pipeline_translator import translate_pipeline
from weaverbird.pipeline import PipelineWithVariables
from weaverbird.utils.toucan_connectors import nosql_apply_parameters_to_query_with_errors

exec_type = "mongo"
test_cases = retrieve_case("mongo_translator", exec_type)


def unused_port():
    """find an unused TCP port and return it"""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind(("127.0.0.1", 0))
        return s.getsockname()[1]


@pytest.fixture(scope="session")
def mongo_version():
    return "7"


@pytest.fixture(scope="session")
def mongo_server_port(mongo_version):
    port = unused_port()
    docker_client = docker.from_env()
    container = docker_client.containers.run(
        f"mongo:{mongo_version}", ports={"27017": port}, auto_remove=True, detach=True
    )
    yield port
    container.kill()


@pytest.fixture()
def mongo_database(mongo_server_port):
    client = MongoClient("localhost", mongo_server_port)
    return client["tests"]


def _sanitize_df(df: pd.DataFrame) -> pd.DataFrame:
    non_numeric_cols = [col for col, dtype in df.dtypes.items() if not is_numeric_dtype(dtype)]
    # Ensure we have None for non-numeric columns such as datetimes or
    # strings, rather than NaT or NaN (for strings)
    for col in non_numeric_cols:
        if is_datetime64_any_dtype(df[col]):
            # Mongo client is not tz-aware, so we make the objects
            # naive here
            df[col] = df[col].dt.tz_localize(None)
        # If we have at least one boolean, and only bools or nulls, convert the column to the boolean dtype
        if (
            not is_bool_dtype(df[col])
            and any(isinstance(elem, bool) for elem in df[col])
            and all(isinstance(elem, bool | None) for elem in df[col])
        ):
            df[col] = df[col].astype("boolean")
        else:
            df[col] = df[col].astype("object").where(pd.notna(df[col]), None)

    return df[sorted(df.columns)]  # order of columns may be different between pandas and mongo


def _sanitized_df_from_pandas_table(df_spec: dict) -> pd.DataFrame:
    df = _sanitize_df(pd.read_json(StringIO(json.dumps(df_spec)), orient="table"))
    bool_cols = [f["name"] for f in df_spec["schema"]["fields"] if f["type"] == "boolean"]
    # By default, pandas converts null bools to False. This enforces
    # use of nullable booleans
    for col in bool_cols:
        df[col] = pd.Series((record[col] for record in df_spec["data"]), dtype="boolean")

    return df


@pytest.mark.parametrize("case_id,case_spec_file_path", test_cases)
def test_mongo_translator_pipeline(mongo_database, case_id, case_spec_file_path, available_variables):
    # insert in mongoDB
    collection_uid = uuid.uuid4().hex
    spec = get_spec_from_json_fixture(case_id, case_spec_file_path)
    data = _sanitized_df_from_pandas_table(spec["input"]).to_dict(orient="records")
    mongo_database[collection_uid].insert_many(data)
    if "other_inputs" in spec and (
        "join" in case_id or "append" in case_id
    ):  # needed for join & append steps tests as we need a != collection
        for collection_name, raw_df in spec["other_inputs"].items():
            df = pd.read_json(StringIO(json.dumps(raw_df)), orient="table")
            mongo_database[collection_name].insert_many(df.to_dict(orient="records"))

    # create query
    steps = spec["step"]["pipeline"]
    pipeline = PipelineWithVariables(steps=steps).render(
        available_variables, nosql_apply_parameters_to_query_with_errors
    )
    query = translate_pipeline(pipeline)
    # execute query
    result = list(mongo_database[collection_uid].aggregate(query))
    df = _sanitize_df(pd.DataFrame(result))
    if "_id" in df:
        df.drop("_id", axis=1, inplace=True)
    expected_df = _sanitized_df_from_pandas_table(
        spec[f"expected_{exec_type}" if f"expected_{exec_type}" in spec else "expected"]
    )
    # FIXME: should use assert_dataframe_equals, as we're not checking order here
    assert_dataframes_content_equals(df, expected_df)
