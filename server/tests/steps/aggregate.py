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


def test_multiple_aggregate(sample_df):
    df_result = AggregateStep(
        name='aggregate',
        on=['colA'],
        aggregations=[
            Aggregation(agg_function='sum', columns=['colB'], new_columns=['sum_colB']),
            Aggregation(agg_function='min', columns=['colB'], new_columns=['sum_colB']),
        ],
    ).execute(sample_df, domain_retriever=None)

    assert_dataframes_equals(df_result, DataFrame({'colC': [175], 'colB': [1]}))
