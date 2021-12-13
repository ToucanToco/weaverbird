import datetime
import json
from glob import glob
from os import path
from typing import Any, List

import pytest
from pandas import DataFrame, Series
from pandas.testing import assert_frame_equal, assert_series_equal


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


def assert_column_equals(serie: Series, values: List[Any]):
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
    0: 'float',
    1: 'real',
    2: 'text',
    3: 'date',
    4: 'timestamp',
    5: 'variant',
    6: 'timestamp_ltz',
    7: 'timestamp_tz',
    8: 'timestamp_ntz',
    9: 'object',
    10: 'array',
    11: 'binary',
    12: 'time',
    13: 'boolean',
}


def is_excluded(file, provider):
    spec_file = open(file, 'r')
    spec = json.loads(spec_file.read())
    spec_file.close()
    if 'exclude' in spec and provider in spec['exclude']:
        return True
    return False


def retrieve_case(directory, provider):
    fixtures_dir_path = path.join(path.dirname(path.realpath(__file__)), 'backends/fixtures')
    step_cases_files = glob(path.join(fixtures_dir_path, '*/*.json'))

    test_cases = []
    for x in step_cases_files:
        # Generate a readable id for each test case
        case_hierarchy = path.dirname(x)[len(fixtures_dir_path) :]
        case_name = path.splitext(path.basename(x))[0]
        case_id = case_hierarchy + '_' + case_name
        if not is_excluded(x, provider):
            test_cases.append(pytest.param(case_id, x, id=case_id))
    return test_cases


def get_spec_from_json_fixture(case_id: str, case_spec_file_path: str) -> dict:
    spec_file = open(case_spec_file_path, 'r')

    # if it's a date type step like the filter on date
    if 'filter_' in case_id and 'date' in case_id:

        def _datetime_parser(dct):
            for k, v in dct.items():
                if isinstance(dct[k], str) and dct[k].startswith(
                    "date:",
                ):
                    try:
                        dct[k] = datetime.datetime.strptime(v, "date: %Y-%m-%d %H:%M:%S")
                    except Exception as es:
                        print(es)
            return dct

        spec = json.loads(spec_file.read(), object_hook=_datetime_parser)
    else:
        spec = json.loads(spec_file.read())
    spec_file.close()

    return spec
