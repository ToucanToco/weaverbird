import pytest
from pandas import DataFrame

from tests.utils import assert_dataframes_equals
from weaverbird.steps.aggregate import AggregateStep, Aggregation


@pytest.fixture
def sample_df():
    return DataFrame(
        {'colA': ['toto', 'tutu', 'tata', 'toto'], 'colB': [1, 2, 3, 4], 'colC': [100, 50, 25, 0]}
    )


def test_simple_aggregate(sample_df):
    df_result = AggregateStep(
        name='aggregate',
        on=['colA'],
        aggregations=[Aggregation(agg_function='sum', columns=['colB'], new_columns=['sum_colB'])],
    ).execute(sample_df, domain_retriever=None)

    assert_dataframes_equals(
        df_result.sort_values(by=['colA']),
        DataFrame({'colA': ['toto', 'tutu', 'tata'], 'sum_colB': [5, 2, 3]}).sort_values(
            by=['colA']
        ),
    )


def test_avg(sample_df):
    df_result = AggregateStep(
        name='aggregate',
        on=['colA'],
        aggregations=[Aggregation(agg_function='avg', columns=['colB'], new_columns=['avg_colB'])],
    ).execute(sample_df, domain_retriever=None)

    assert_dataframes_equals(
        df_result.sort_values(by=['colA']),
        DataFrame({'colA': ['toto', 'tutu', 'tata'], 'avg_colB': [2.5, 2.0, 3.0]}).sort_values(
            by=['colA']
        ),
    )


def test_aggregate_is_no_valid_without_on(sample_df):
    with pytest.raises(ValueError):
        AggregateStep(
            name='aggregate',
            on=[],
            aggregations=[
                Aggregation(agg_function='min', columns=['colB'], new_columns=['min_colB']),
            ],
        )


def test_multiple_aggregate(sample_df):
    df_result = AggregateStep(
        name='aggregate',
        on=['colA'],
        aggregations=[
            Aggregation(agg_function='min', columns=['colB'], new_columns=['min_colB']),
            Aggregation(agg_function='max', columns=['colB'], new_columns=['max_colB']),
        ],
    ).execute(sample_df, domain_retriever=None)

    assert_dataframes_equals(df_result, DataFrame(
        {'colA': ['tata', 'toto', 'tutu'], 'min_colB': [3, 1, 2], 'max_colB': [3, 4, 2]}))
