import random

import pytest
from pandas import DataFrame

from tests.utils import assert_dataframes_equals
from weaverbird.backends.pandas_executor.steps.rollup import execute_rollup
from weaverbird.pipeline.steps import RollupStep


@pytest.fixture
def sample_df():
    columns = ["CITY", "COUNTRY", "CONTINENT", "YEAR", "VALUE"]
    data = [
        ["Paris", "France", "Europe", 2018, 10],
        ["Bordeaux", "France", "Europe", 2018, 5],
        ["Barcelona", "Spain", "Europe", 2018, 8],
        ["Madrid", "Spain", "Europe", 2018, 3],
        ["Boston", "USA", "North America", 2018, 12],
        ["New-York", "USA", "North America", 2018, 21],
        ["Montreal", "Canada", "North America", 2018, 10],
        ["Ottawa", "Canada", "North America", 2018, 7],
        ["Paris", "France", "Europe", 2019, 13],
        ["Bordeaux", "France", "Europe", 2019, 8],
        ["Barcelona", "Spain", "Europe", 2019, 11],
        ["Madrid", "Spain", "Europe", 2019, 6],
        ["Boston", "USA", "North America", 2019, 15],
        ["New-York", "USA", "North America", 2019, 24],
        ["Montreal", "Canada", "North America", 2019, 10],
        ["Ottawa", "Canada", "North America", 2019, 13],
    ]
    return DataFrame(data, columns=columns)


def test_rollup(sample_df: DataFrame):
    step = RollupStep(
        name="rollup",
        hierarchy=["CONTINENT", "COUNTRY", "CITY"],
        aggregations=[
            {"newcolumns": ["VALUE"], "aggfunction": "sum", "columns": ["VALUE"]},
        ],
    )
    df_result = execute_rollup(step, sample_df)

    columns = ["CITY", "COUNTRY", "CONTINENT", "label", "level", "child_level", "parent", "VALUE"]
    expected_data = [
        [None, None, "Europe", "Europe", "CONTINENT", "COUNTRY", None, 64],
        [None, None, "North America", "North America", "CONTINENT", "COUNTRY", None, 112],
        [None, "France", "Europe", "France", "COUNTRY", "CITY", "Europe", 36],
        [None, "Spain", "Europe", "Spain", "COUNTRY", "CITY", "Europe", 28],
        [None, "Canada", "North America", "Canada", "COUNTRY", "CITY", "North America", 40],
        [None, "USA", "North America", "USA", "COUNTRY", "CITY", "North America", 72],
        ["Bordeaux", "France", "Europe", "Bordeaux", "CITY", None, "France", 13],
        ["Paris", "France", "Europe", "Paris", "CITY", None, "France", 23],
        ["Barcelona", "Spain", "Europe", "Barcelona", "CITY", None, "Spain", 19],
        ["Madrid", "Spain", "Europe", "Madrid", "CITY", None, "Spain", 9],
        ["Montreal", "Canada", "North America", "Montreal", "CITY", None, "Canada", 20],
        ["Ottawa", "Canada", "North America", "Ottawa", "CITY", None, "Canada", 20],
        ["Boston", "USA", "North America", "Boston", "CITY", None, "USA", 27],
        ["New-York", "USA", "North America", "New-York", "CITY", None, "USA", 45],
    ]
    expected_result = DataFrame(expected_data, columns=columns)
    assert_dataframes_equals(df_result, expected_result)


def test_rollup_without_aggregation(sample_df: DataFrame):
    step = RollupStep(
        name="rollup",
        hierarchy=["CONTINENT", "COUNTRY", "CITY"],
        aggregations=[],
    )
    df_result = execute_rollup(step, sample_df)

    columns = ["CITY", "COUNTRY", "CONTINENT", "label", "level", "child_level", "parent"]
    expected_data = [
        [None, None, "Europe", "Europe", "CONTINENT", "COUNTRY", None],
        [None, None, "North America", "North America", "CONTINENT", "COUNTRY", None],
        [None, "France", "Europe", "France", "COUNTRY", "CITY", "Europe"],
        [None, "Spain", "Europe", "Spain", "COUNTRY", "CITY", "Europe"],
        [None, "Canada", "North America", "Canada", "COUNTRY", "CITY", "North America"],
        [None, "USA", "North America", "USA", "COUNTRY", "CITY", "North America"],
        ["Bordeaux", "France", "Europe", "Bordeaux", "CITY", None, "France"],
        ["Paris", "France", "Europe", "Paris", "CITY", None, "France"],
        ["Barcelona", "Spain", "Europe", "Barcelona", "CITY", None, "Spain"],
        ["Madrid", "Spain", "Europe", "Madrid", "CITY", None, "Spain"],
        ["Montreal", "Canada", "North America", "Montreal", "CITY", None, "Canada"],
        ["Ottawa", "Canada", "North America", "Ottawa", "CITY", None, "Canada"],
        ["Boston", "USA", "North America", "Boston", "CITY", None, "USA"],
        ["New-York", "USA", "North America", "New-York", "CITY", None, "USA"],
    ]
    expected_result = DataFrame(expected_data, columns=columns)
    assert_dataframes_equals(df_result, expected_result)


def test_complex_rollup(sample_df: DataFrame):
    sample_df = sample_df.assign(COUNT=1)
    step = RollupStep(
        name="rollup",
        hierarchy=["CONTINENT", "COUNTRY", "CITY"],
        aggregations=[
            {
                "newcolumns": ["VALUE-sum", "COUNT"],
                "aggfunction": "sum",
                "columns": ["VALUE", "COUNT"],
            },
            {"newcolumns": ["VALUE-avg"], "aggfunction": "avg", "columns": ["VALUE"]},
        ],
        groupby=["YEAR"],
        labelCol="MY_LABEL",
        levelCol="MY_LEVEL",
        childLevelCol="MY_CHILD_LEVEL",
        parentLabelCol="MY_PARENT",
    )
    df_result = execute_rollup(step, sample_df)

    columns = [
        "CITY",
        "COUNTRY",
        "CONTINENT",
        "YEAR",
        "MY_LABEL",
        "MY_LEVEL",
        "MY_CHILD_LEVEL",
        "MY_PARENT",
        "VALUE-sum",
        "VALUE-avg",
        "COUNT",
    ]
    expected_data = [
        [None, None, "Europe", 2018, "Europe", "CONTINENT", "COUNTRY", None, 26, 6.5, 4],
        [None, None, "North America", 2018, "North America", "CONTINENT", "COUNTRY", None, 50, 12.5, 4],
        [None, None, "Europe", 2019, "Europe", "CONTINENT", "COUNTRY", None, 38, 9.5, 4],
        [None, None, "North America", 2019, "North America", "CONTINENT", "COUNTRY", None, 62, 15.5, 4],
        [None, "France", "Europe", 2018, "France", "COUNTRY", "CITY", "Europe", 15, 7.5, 2],
        [None, "Spain", "Europe", 2018, "Spain", "COUNTRY", "CITY", "Europe", 11, 5.5, 2],
        [None, "Canada", "North America", 2018, "Canada", "COUNTRY", "CITY", "North America", 17, 8.5, 2],
        [None, "USA", "North America", 2018, "USA", "COUNTRY", "CITY", "North America", 33, 16.5, 2],
        [None, "France", "Europe", 2019, "France", "COUNTRY", "CITY", "Europe", 21, 10.5, 2],
        [None, "Spain", "Europe", 2019, "Spain", "COUNTRY", "CITY", "Europe", 17, 8.5, 2],
        [None, "Canada", "North America", 2019, "Canada", "COUNTRY", "CITY", "North America", 23, 11.5, 2],
        [None, "USA", "North America", 2019, "USA", "COUNTRY", "CITY", "North America", 39, 19.5, 2],
        ["Bordeaux", "France", "Europe", 2018, "Bordeaux", "CITY", None, "France", 5, 5, 1],
        ["Paris", "France", "Europe", 2018, "Paris", "CITY", None, "France", 10, 10, 1],
        ["Barcelona", "Spain", "Europe", 2018, "Barcelona", "CITY", None, "Spain", 8, 8, 1],
        ["Madrid", "Spain", "Europe", 2018, "Madrid", "CITY", None, "Spain", 3, 3, 1],
        ["Montreal", "Canada", "North America", 2018, "Montreal", "CITY", None, "Canada", 10, 10, 1],
        ["Ottawa", "Canada", "North America", 2018, "Ottawa", "CITY", None, "Canada", 7, 7, 1],
        ["Boston", "USA", "North America", 2018, "Boston", "CITY", None, "USA", 12, 12, 1],
        ["New-York", "USA", "North America", 2018, "New-York", "CITY", None, "USA", 21, 21, 1],
        ["Bordeaux", "France", "Europe", 2019, "Bordeaux", "CITY", None, "France", 8, 8, 1],
        ["Paris", "France", "Europe", 2019, "Paris", "CITY", None, "France", 13, 13, 1],
        ["Barcelona", "Spain", "Europe", 2019, "Barcelona", "CITY", None, "Spain", 11, 11, 1],
        ["Madrid", "Spain", "Europe", 2019, "Madrid", "CITY", None, "Spain", 6, 6, 1],
        ["Montreal", "Canada", "North America", 2019, "Montreal", "CITY", None, "Canada", 10, 10, 1],
        ["Ottawa", "Canada", "North America", 2019, "Ottawa", "CITY", None, "Canada", 13, 13, 1],
        ["Boston", "USA", "North America", 2019, "Boston", "CITY", None, "USA", 15, 15, 1],
        ["New-York", "USA", "North America", 2019, "New-York", "CITY", None, "USA", 24, 24, 1],
    ]
    expected_result = DataFrame(expected_data, columns=columns)
    assert_dataframes_equals(df_result, expected_result)


def _make_benchmark_data():
    cities = {
        "France": ["Paris", "Bordeaux"],
        "Spain": ["Barcelona", "Madrid"],
        "USA": ["Boston", "New York"],
    }
    columns = ["CITY", "COUNTRY", "DAY", "VALUE"]
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
        name="rollup",
        hierarchy=["COUNTRY", "CITY"],
        aggregations=[
            {"newcolumns": ["VALUE"], "aggfunction": "sum", "columns": ["VALUE"]},
        ],
    )
    benchmark(execute_rollup, step, df)
