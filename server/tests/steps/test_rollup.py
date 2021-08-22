import random

import pytest
from pandas import DataFrame

from tests.utils import assert_dataframes_equals
from weaverbird.backends.pandas_executor.steps.rollup import execute_rollup
from weaverbird.pipeline.steps import RollupStep


@pytest.fixture
def sample_df():
    columns = ['CITY', 'COUNTRY', 'CONTINENT', 'YEAR', 'VALUE']
    data = [
        ['Paris', 'France', 'Europe', 2018, 10],
        ['Bordeaux', 'France', 'Europe', 2018, 5],
        ['Barcelona', 'Spain', 'Europe', 2018, 8],
        ['Madrid', 'Spain', 'Europe', 2018, 3],
        ['Boston', 'USA', 'North America', 2018, 12],
        ['New-York', 'USA', 'North America', 2018, 21],
        ['Montreal', 'Canada', 'North America', 2018, 10],
        ['Ottawa', 'Canada', 'North America', 2018, 7],
        ['Paris', 'France', 'Europe', 2019, 13],
        ['Bordeaux', 'France', 'Europe', 2019, 8],
        ['Barcelona', 'Spain', 'Europe', 2019, 11],
        ['Madrid', 'Spain', 'Europe', 2019, 6],
        ['Boston', 'USA', 'North America', 2019, 15],
        ['New-York', 'USA', 'North America', 2019, 24],
        ['Montreal', 'Canada', 'North America', 2019, 10],
        ['Ottawa', 'Canada', 'North America', 2019, 13],
    ]
    return DataFrame(data, columns=columns)


def test_rollup(sample_df: DataFrame):
    step = RollupStep(
        name='rollup',
        hierarchy=['CONTINENT', 'COUNTRY', 'CITY'],
        aggregations=[
            {'newcolumns': ['VALUE'], 'aggfunction': 'sum', 'columns': ['VALUE']},
        ],
    )
    df_result = execute_rollup(step, sample_df)

    columns = ['CITY', 'COUNTRY', 'CONTINENT', 'label', 'level', 'parent', 'VALUE']
    expected_data = [
        [None, None, 'Europe', 'Europe', 'CONTINENT', None, 64],
        [None, None, 'North America', 'North America', 'CONTINENT', None, 112],
        [None, 'France', 'Europe', 'France', 'COUNTRY', 'Europe', 36],
        [None, 'Spain', 'Europe', 'Spain', 'COUNTRY', 'Europe', 28],
        [None, 'Canada', 'North America', 'Canada', 'COUNTRY', 'North America', 40],
        [None, 'USA', 'North America', 'USA', 'COUNTRY', 'North America', 72],
        ['Bordeaux', 'France', 'Europe', 'Bordeaux', 'CITY', 'France', 13],
        ['Paris', 'France', 'Europe', 'Paris', 'CITY', 'France', 23],
        ['Barcelona', 'Spain', 'Europe', 'Barcelona', 'CITY', 'Spain', 19],
        ['Madrid', 'Spain', 'Europe', 'Madrid', 'CITY', 'Spain', 9],
        ['Montreal', 'Canada', 'North America', 'Montreal', 'CITY', 'Canada', 20],
        ['Ottawa', 'Canada', 'North America', 'Ottawa', 'CITY', 'Canada', 20],
        ['Boston', 'USA', 'North America', 'Boston', 'CITY', 'USA', 27],
        ['New-York', 'USA', 'North America', 'New-York', 'CITY', 'USA', 45],
    ]
    expected_result = DataFrame(expected_data, columns=columns)
    assert_dataframes_equals(df_result, expected_result)


def test_rollup_without_aggregation(sample_df: DataFrame):
    step = RollupStep(
        name='rollup',
        hierarchy=['CONTINENT', 'COUNTRY', 'CITY'],
        aggregations=[],
    )
    df_result = execute_rollup(step, sample_df)

    columns = ['CITY', 'COUNTRY', 'CONTINENT', 'label', 'level', 'parent']
    expected_data = [
        [None, None, 'Europe', 'Europe', 'CONTINENT', None],
        [None, None, 'North America', 'North America', 'CONTINENT', None],
        [None, 'France', 'Europe', 'France', 'COUNTRY', 'Europe'],
        [None, 'Spain', 'Europe', 'Spain', 'COUNTRY', 'Europe'],
        [None, 'Canada', 'North America', 'Canada', 'COUNTRY', 'North America'],
        [None, 'USA', 'North America', 'USA', 'COUNTRY', 'North America'],
        ['Bordeaux', 'France', 'Europe', 'Bordeaux', 'CITY', 'France'],
        ['Paris', 'France', 'Europe', 'Paris', 'CITY', 'France'],
        ['Barcelona', 'Spain', 'Europe', 'Barcelona', 'CITY', 'Spain'],
        ['Madrid', 'Spain', 'Europe', 'Madrid', 'CITY', 'Spain'],
        ['Montreal', 'Canada', 'North America', 'Montreal', 'CITY', 'Canada'],
        ['Ottawa', 'Canada', 'North America', 'Ottawa', 'CITY', 'Canada'],
        ['Boston', 'USA', 'North America', 'Boston', 'CITY', 'USA'],
        ['New-York', 'USA', 'North America', 'New-York', 'CITY', 'USA'],
    ]
    expected_result = DataFrame(expected_data, columns=columns)
    assert_dataframes_equals(df_result, expected_result)


def test_complex_rollup(sample_df: DataFrame):
    sample_df = sample_df.assign(COUNT=1)
    step = RollupStep(
        name='rollup',
        hierarchy=['CONTINENT', 'COUNTRY', 'CITY'],
        aggregations=[
            {
                'newcolumns': ['VALUE-sum', 'COUNT'],
                'aggfunction': 'sum',
                'columns': ['VALUE', 'COUNT'],
            },
            {'newcolumns': ['VALUE-avg'], 'aggfunction': 'avg', 'columns': ['VALUE']},
        ],
        groupby=['YEAR'],
        labelCol='MY_LABEL',
        levelCol='MY_LEVEL',
        parentLabelCol='MY_PARENT',
    )
    df_result = execute_rollup(step, sample_df)

    columns = [
        'CITY',
        'COUNTRY',
        'CONTINENT',
        'YEAR',
        'MY_LABEL',
        'MY_LEVEL',
        'MY_PARENT',
        'VALUE-sum',
        'VALUE-avg',
        'COUNT',
    ]
    expected_data = [
        [None, None, 'Europe', 2018, 'Europe', 'CONTINENT', None, 26, 6.5, 4],
        [None, None, 'North America', 2018, 'North America', 'CONTINENT', None, 50, 12.5, 4],
        [None, None, 'Europe', 2019, 'Europe', 'CONTINENT', None, 38, 9.5, 4],
        [None, None, 'North America', 2019, 'North America', 'CONTINENT', None, 62, 15.5, 4],
        [None, 'France', 'Europe', 2018, 'France', 'COUNTRY', 'Europe', 15, 7.5, 2],
        [None, 'Spain', 'Europe', 2018, 'Spain', 'COUNTRY', 'Europe', 11, 5.5, 2],
        [None, 'Canada', 'North America', 2018, 'Canada', 'COUNTRY', 'North America', 17, 8.5, 2],
        [None, 'USA', 'North America', 2018, 'USA', 'COUNTRY', 'North America', 33, 16.5, 2],
        [None, 'France', 'Europe', 2019, 'France', 'COUNTRY', 'Europe', 21, 10.5, 2],
        [None, 'Spain', 'Europe', 2019, 'Spain', 'COUNTRY', 'Europe', 17, 8.5, 2],
        [None, 'Canada', 'North America', 2019, 'Canada', 'COUNTRY', 'North America', 23, 11.5, 2],
        [None, 'USA', 'North America', 2019, 'USA', 'COUNTRY', 'North America', 39, 19.5, 2],
        ['Bordeaux', 'France', 'Europe', 2018, 'Bordeaux', 'CITY', 'France', 5, 5, 1],
        ['Paris', 'France', 'Europe', 2018, 'Paris', 'CITY', 'France', 10, 10, 1],
        ['Barcelona', 'Spain', 'Europe', 2018, 'Barcelona', 'CITY', 'Spain', 8, 8, 1],
        ['Madrid', 'Spain', 'Europe', 2018, 'Madrid', 'CITY', 'Spain', 3, 3, 1],
        ['Montreal', 'Canada', 'North America', 2018, 'Montreal', 'CITY', 'Canada', 10, 10, 1],
        ['Ottawa', 'Canada', 'North America', 2018, 'Ottawa', 'CITY', 'Canada', 7, 7, 1],
        ['Boston', 'USA', 'North America', 2018, 'Boston', 'CITY', 'USA', 12, 12, 1],
        ['New-York', 'USA', 'North America', 2018, 'New-York', 'CITY', 'USA', 21, 21, 1],
        ['Bordeaux', 'France', 'Europe', 2019, 'Bordeaux', 'CITY', 'France', 8, 8, 1],
        ['Paris', 'France', 'Europe', 2019, 'Paris', 'CITY', 'France', 13, 13, 1],
        ['Barcelona', 'Spain', 'Europe', 2019, 'Barcelona', 'CITY', 'Spain', 11, 11, 1],
        ['Madrid', 'Spain', 'Europe', 2019, 'Madrid', 'CITY', 'Spain', 6, 6, 1],
        ['Montreal', 'Canada', 'North America', 2019, 'Montreal', 'CITY', 'Canada', 10, 10, 1],
        ['Ottawa', 'Canada', 'North America', 2019, 'Ottawa', 'CITY', 'Canada', 13, 13, 1],
        ['Boston', 'USA', 'North America', 2019, 'Boston', 'CITY', 'USA', 15, 15, 1],
        ['New-York', 'USA', 'North America', 2019, 'New-York', 'CITY', 'USA', 24, 24, 1],
    ]
    expected_result = DataFrame(expected_data, columns=columns)
    assert_dataframes_equals(df_result, expected_result)


def _make_benchmark_data():
    cities = {
        'France': ['Paris', 'Bordeaux'],
        'Spain': ['Barcelona', 'Madrid'],
        'USA': ['Boston', 'New York'],
    }
    columns = ['CITY', 'COUNTRY', 'DAY', 'VALUE']
    data = []
    for country in cities.keys():
        for city in cities[country]:
            for i in range(1000):
                row = [city, country, i, random.randint(0, 2000)]
                data.append(row)
    return DataFrame(data, columns=columns)


def test_benchmark_rollup(benchmark):
    df = _make_benchmark_data()

    step = RollupStep(
        name='rollup',
        hierarchy=['COUNTRY', 'CITY'],
        aggregations=[
            {'newcolumns': ['VALUE'], 'aggfunction': 'sum', 'columns': ['VALUE']},
        ],
    )
    benchmark(execute_rollup, step, df)
