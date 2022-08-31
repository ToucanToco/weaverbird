import pytest
from pandas import DataFrame

from weaverbird.backends.pandas_executor.steps.utils.cleaning import rename_duplicated_columns
from weaverbird.utils.iter import combinations


@pytest.mark.parametrize(
    ("columns", "expected_new_columns"),
    [
        (
            ["foo"],
            ["foo"],
        ),
        (
            ["foo", "foo"],
            ["foo", "foo_1"],
        ),
        (
            ["foo", "foo_1", "foo_2", "foo_3", "foo"],
            ["foo", "foo_1", "foo_2", "foo_3", "foo_4"],
        ),
        (
            ["foo_1", "foo_1"],
            ["foo_1", "foo_2"],
        ),
        (
            ["foo_1", "foo_1", "foo_2"],
            ["foo_1", "foo_3", "foo_2"],
        ),
        (
            ["foo", "foo", "foo_1"],
            ["foo", "foo_2", "foo_1"],
        ),
        (
            ["foo", "foo_3", "foo"],
            ["foo", "foo_3", "foo_4"],
        ),
        (
            ["foo", "foo", "foo_5", "foo_5"],
            ["foo", "foo_6", "foo_5", "foo_7"],
        ),
        (
            ["plop", "foo", "bar", "foo", "foo", "bar", "plip", "foo_2", "bar_1"],
            ["plop", "foo", "bar", "foo_3", "foo_4", "bar_2", "plip", "foo_2", "bar_1"],
        ),
    ],
)
def test_rename_duplicated_columns(columns, expected_new_columns):
    # ensure there are no duplicates in the output:
    assert len(expected_new_columns) == len(set(expected_new_columns))

    df = DataFrame(columns=columns)
    assert list(df.columns) == columns

    df_renamed = rename_duplicated_columns(df)
    assert list(df_renamed.columns) == expected_new_columns


def test_combinations():
    assert combinations(["A", "B", "C"]) == [
        ("A",),
        ("B",),
        ("C",),
        ("A", "B"),
        ("A", "C"),
        ("B", "C"),
        ("A", "B", "C"),
    ]
