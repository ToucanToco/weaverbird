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
    0: 'int',
    1: 'float',
    2: 'str',
    3: 'date',
    4: 'timestamp',
    5: 'variant',
    6: 'timestamp_ltz',
    7: 'timestamp_tz',
    8: 'timestampe_ntz',
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

    steps_dir_path = path.join(
        path.dirname(path.realpath(__file__)), f'../weaverbird/backends/{directory}/steps'
    )
    step_available = [
        f.replace(steps_dir_path + '/', '').replace('.py', '')
        for f in glob(path.join(steps_dir_path, '*.py'))
        if not f.endswith('__init__.py')
    ]

    test_cases = []
    for x in step_cases_files:
        # Generate a readable id for each test case
        case_hierarchy = path.dirname(x)[len(fixtures_dir_path) :]
        c = case_hierarchy.replace('/', '')
        case_name = path.splitext(path.basename(x))[0]
        case_id = case_hierarchy + '_' + case_name
        if c in step_available and not is_excluded(x, provider):
            test_cases.append(pytest.param(case_id, x, id=case_id))
    return test_cases
