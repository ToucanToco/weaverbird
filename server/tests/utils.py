import contextlib
import datetime
import json
import logging
from collections.abc import Generator
from glob import glob
from os import path
from typing import Any, List

import docker
import pytest
import yaml
from docker.models.containers import Container
from pandas import DataFrame, Series
from pandas.testing import assert_frame_equal, assert_series_equal

_BEERS_TABLE_COLUMNS = [
    "price_per_l",
    "alcohol_degree",
    "name",
    "cost",
    "beer_kind",
    "volume_ml",
    "brewing_date",
    "nullable_name",
]


def assert_dataframes_equals(left: DataFrame, right: DataFrame):
    """
    Compare two dataframes columns and values, not their index.
    """
    assert_frame_equal(
        left.reset_index(drop=True),
        right.reset_index(drop=True),
        check_like=True,
        check_dtype=False,
    )


def assert_dataframes_content_equals(left: DataFrame, right: DataFrame):
    """
    Compare two dataframes columns and values, not their index.
    """
    assert_frame_equal(
        left.sort_values(by=left.columns.tolist()).reset_index(drop=True),
        right.sort_values(by=right.columns.tolist()).reset_index(drop=True),
        check_like=True,
        check_dtype=False,
    )


def assert_column_equals(serie: Series, values: list[Any]):
    """
    Compare vales of a dataframe's column (series)
    """
    assert_series_equal(
        serie.reset_index(drop=True),
        Series(values),
        check_names=False,
        check_dtype=False,
    )


type_code_mapping = {
    0: "float",
    1: "real",
    2: "text",
    3: "date",
    4: "timestamp",
    5: "variant",
    6: "timestamp_ltz",
    7: "timestamp_tz",
    8: "timestamp_ntz",
    9: "object",
    10: "array",
    11: "binary",
    12: "time",
    13: "boolean",
}


def load_fixture_file(filename: str) -> dict:
    with open(filename) as fd:
        if filename.endswith(".yml") or filename.endswith(".yaml"):
            return yaml.safe_load(fd)
        return json.load(fd)


def is_excluded(filename: str, provider: str):
    if "exclude" in (spec := load_fixture_file(filename)) and provider in spec["exclude"]:
        return True
    return False


def retrieve_case(directory, provider):
    fixtures_dir_path = path.join(path.dirname(path.realpath(__file__)), "backends/fixtures")
    step_cases_files = (
        glob(path.join(fixtures_dir_path, "*/*.json"))
        + glob(path.join(fixtures_dir_path, "*/*.yaml"))
        + glob(path.join(fixtures_dir_path, "*/*.yml"))
    )

    test_cases = []
    for x in step_cases_files:
        # Generate a readable id for each test case
        case_hierarchy = path.dirname(x)[len(fixtures_dir_path) :]
        case_name = path.splitext(path.basename(x))[0]
        case_id = case_hierarchy + "_" + case_name
        if not is_excluded(x, provider):
            test_cases.append(pytest.param(case_id, x, id=case_id))
    return test_cases


def get_spec_from_json_fixture(case_id: str, case_spec_file_path: str) -> dict:
    spec = load_fixture_file(case_spec_file_path)

    # if it's a date type step like the filter on date
    if "date" in case_id:

        def _datetime_parser(dct: dict):
            for k, v in dct.items():
                if isinstance(dct[k], str) and dct[k].startswith(
                    "date:",
                ):
                    try:
                        dct[k] = datetime.datetime.strptime(v, "date: %Y-%m-%d %H:%M:%S%z")
                    except ValueError:  # Raised for strings without TZ info
                        dct[k] = datetime.datetime.strptime(v, "date: %Y-%m-%d %H:%M:%S")
            return dct

        # Sub-optimal but still fast enough for tests
        spec = json.loads(json.dumps(spec), object_hook=_datetime_parser)

    return spec


@contextlib.contextmanager
def docker_container(
    image_name: str,
    image_version: str,
    name: str,
    environment: dict[str, str] | None = None,
    ports: dict[str, str] | None = None,
    **run_kwargs: Any,
) -> Generator[Container, None, None]:
    logger = logging.getLogger(__name__)

    image_str = f"{image_name}:{image_version}"
    docker_client = docker.from_env()
    found = False
    for i in docker_client.images.list():
        try:
            if i.tags[0] == image_str:
                found = True
        except IndexError:
            pass
    if not found:
        logger.info(f"Downloading docker image {image_str}")
        docker_client.images.pull(image_str)

    logger.info(f"Starting docker image {image_str}")
    container = docker_client.containers.run(
        image=image_str,
        name=name,
        auto_remove=True,
        detach=True,
        environment=environment,
        ports=ports,
        **run_kwargs,
    )
    try:
        yield container
    finally:
        container.kill()
