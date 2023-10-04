import random

import pandas as pd
from weaverbird.backends.pandas_executor.steps.waterfall import execute_waterfall
from weaverbird.pipeline.steps.waterfall import WaterfallStep

from tests.utils import assert_dataframes_equals


def test_simple():
    sample_df = pd.DataFrame(
        {
            "city": ["Bordeaux", "Boston", "New-York", "Paris"] * 2,
            "year": [2019] * 4 + [2018] * 4,
            "revenue": [135, 275, 115, 450, 98, 245, 103, 385],
        }
    )
    step = WaterfallStep(
        name="waterfall",
        valueColumn="revenue",
        milestonesColumn="year",
        start=2018,
        end=2019,
        labelsColumn="city",
        sortBy="value",
        order="desc",
    )
    result_df = execute_waterfall(step, sample_df)

    expected_df = pd.DataFrame(
        {
            "LABEL_waterfall": ["Paris", "Bordeaux", "Boston", "New-York", "2019", "2018"],
            "TYPE_waterfall": ["parent", "parent", "parent", "parent", None, None],
            "revenue": [65, 37, 30, 12, 975, 831],
        }
    )

    assert_dataframes_equals(result_df, expected_df)


def test_simple_with_aggregation():
    sample_df = pd.DataFrame(
        {
            "city": ["Bordeaux", "Boston", "New-York", "Paris", "Paris"] * 2,
            "year": [2019] * 5 + [2018] * 5,
            "revenue": [135, 275, 115, 450, 10, 98, 245, 103, 385, 10],
        }
    )
    step = WaterfallStep(
        name="waterfall",
        valueColumn="revenue",
        milestonesColumn="year",
        start=2018,
        end=2019,
        labelsColumn="city",
        sortBy="value",
        order="desc",
    )
    result_df = execute_waterfall(step, sample_df)
    expected_df = pd.DataFrame(
        {
            "LABEL_waterfall": ["Paris", "Bordeaux", "Boston", "New-York", "2019", "2018"],
            "TYPE_waterfall": ["parent", "parent", "parent", "parent", None, None],
            "revenue": [65, 37, 30, 12, 985, 841],
        }
    )
    assert_dataframes_equals(result_df, expected_df)


def test_with_groups():
    sample_df = pd.DataFrame(
        {
            "city": (["Bordeaux"] * 2 + ["Paris"] * 2 + ["Boston"] * 2 + ["New-York"] * 2) * 2,
            "country": (["France"] * 4 + ["USA"] * 4) * 2,
            "product": ["product1", "product2"] * 8,
            "year": [2019] * 8 + [2018] * 8,
            "revenue": [65, 70, 210, 240, 130, 145, 55, 60, 38, 60, 175, 210, 95, 150, 50, 53],
        }
    )
    step = WaterfallStep(
        name="waterfall",
        valueColumn="revenue",
        milestonesColumn="year",
        start=2018,
        end=2019,
        labelsColumn="city",
        parentsColumn="country",
        groupby=["product"],
        sortBy="label",
        order="asc",
    )
    result_df = execute_waterfall(step, sample_df)

    expected_df = pd.DataFrame(
        {
            "product": [
                "product1",
                "product2",
            ]
            * 8,
            "LABEL_waterfall": ["Bordeaux"] * 2
            + ["Boston"] * 2
            + ["New-York"] * 2
            + ["Paris"] * 2
            + ["France"] * 2
            + ["USA"] * 2
            + ["2018"] * 2
            + ["2019"] * 2,
            "revenue": [27, 10, 35, -5, 5, 7, 35, 30, 62, 40, 40, 2, 358, 473, 460, 515],
            "GROUP_waterfall": ["France"] * 2
            + ["USA"] * 4
            + ["France"] * 4
            + ["USA"] * 2
            + ["2018"] * 2
            + ["2019"] * 2,
            "TYPE_waterfall": ["child"] * 8 + ["parent"] * 4 + [None] * 4,
        }
    )
    assert_dataframes_equals(expected_df, result_df)


def test_bug_duplicate_rows():
    sample_df = pd.DataFrame(
        {
            "city": (["Bordeaux"] * 2 + ["Paris"] * 2 + ["Boston"] * 2 + ["New-York"] * 2) * 2,
            "country": (["France"] * 4 + ["USA"] * 4) * 2,
            "product": ["product1", "product2"] * 8,
            "year": [2019] * 8 + [2018] * 8,
            "revenue": [65, 70, 210, 240, 130, 145, 55, 60, 38, 60, 175, 210, 95, 150, 50, 53],
        }
    )

    step = WaterfallStep(
        name="waterfall",
        valueColumn="revenue",
        milestonesColumn="year",
        start=2018,
        end=2019,
        labelsColumn="country",
        sortBy="label",
        order="asc",
    )
    result_df = execute_waterfall(step, sample_df)

    expected_df = pd.DataFrame(
        {
            "LABEL_waterfall": ["France", "USA", "2018", "2019"],
            "revenue": [102, 42, 831, 975],
            "TYPE_waterfall": ["parent", "parent", None, None],
        }
    )
    assert_dataframes_equals(result_df, expected_df)


def test_waterfall_bug_drill():
    """
    Tuple (label, parent) should be unique only among one "group by" sub-df.
    """
    base_df = pd.DataFrame(
        {
            "grand parent": ["Food", "Vegetarian", "Fruits"] * 2,
            "parent": ["Vegetarian", "Fruits", "Berries"] * 2,
            "label": ["Fruits", "Berries", "Blueberries"] * 2,
            "variable": ["A"] * 3 + ["B"] * 3,
            "value": [1, 2, 3, 11, 12, 13],
        }
    )
    step = WaterfallStep(
        name="waterfall",
        valueColumn="value",
        milestonesColumn="variable",
        start="A",
        end="B",
        labelsColumn="label",
        parentsColumn="parent",
        groupby=["grand parent"],
        sortBy="label",
        order="asc",
    )
    result = execute_waterfall(step, base_df)
    expected_df = pd.DataFrame(
        {
            "grand parent": [
                "Vegetarian",
                "Fruits",
                "Food",
                "Fruits",
                "Vegetarian",
                "Food",
                "Food",
                "Vegetarian",
                "Fruits",
                "Food",
                "Vegetarian",
                "Fruits",
            ],
            "LABEL_waterfall": [
                "Berries",
                "Blueberries",
                "Fruits",
                "Berries",
                "Fruits",
                "Vegetarian",
            ]
            + ["A"] * 3
            + ["B"] * 3,
            "value": [10] * 6 + [1, 2, 3] + [11, 12, 13],
            "GROUP_waterfall": [
                "Fruits",
                "Berries",
                "Vegetarian",
                "Berries",
                "Fruits",
                "Vegetarian",
            ]
            + ["A"] * 3
            + ["B"] * 3,
            "TYPE_waterfall": ["child"] * 3 + ["parent"] * 3 + [None] * 6,
        }
    )

    assert_dataframes_equals(result, expected_df)


def _make_benchmark_data():
    cities = {
        "France": ["Paris", "Bordeaux"],
        "Spain": ["Barcelona", "Madrid"],
        "USA": ["Boston", "New York"],
    }
    groups = ["A", "B"]
    products = ["product_" + str(n) for n in range(1000)]

    columns = ["country", "city", "group", "product", "value"]
    data = []
    for country in cities.keys():
        for city in cities[country]:
            for group in groups:
                for product in products:
                    row = [country, city, group, product, random.randint(1, 250)]
                    data.append(row)
    return pd.DataFrame(data, columns=columns)


def test_benchmark_waterfall(benchmark):
    df = _make_benchmark_data()

    step = WaterfallStep(
        name="waterfall",
        valueColumn="value",
        milestonesColumn="group",
        start="A",
        end="B",
        labelsColumn="city",
        parentsColumn="country",
        groupby=[],
        sortBy="label",
        order="asc",
    )
    benchmark(execute_waterfall, step, df[0:1000])
