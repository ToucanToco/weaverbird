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
        aggregations=[Aggregation(aggfunction='sum', columns=['colB'], newcolumns=['sum_colB'])],
    ).execute(sample_df, domain_retriever=None)

    assert_dataframes_equals(
        df_result.sort_values(by=['colA']),
        DataFrame({'colA': ['toto', 'tutu', 'tata'], 'sum_colB': [5, 2, 3]}).sort_values(
            by=['colA']
        ),
    )


def test_simple_aggregate_multiple_columns(sample_df):
    df_result = AggregateStep(
        name='aggregate',
        on=['colA'],
        aggregations=[
            Aggregation(
                aggfunction='sum', columns=['colB', 'colC'], newcolumns=['sum_colB', 'sum_colC']
            )
        ],
    ).execute(sample_df, domain_retriever=None)

    assert_dataframes_equals(
        df_result.sort_values(by=['colA']),
        DataFrame(
            {'colA': ['toto', 'tutu', 'tata'], 'sum_colB': [5, 2, 3], 'sum_colC': [100, 50, 25]}
        ).sort_values(by=['colA']),
    )


def test_avg(sample_df):
    df_result = AggregateStep(
        name='aggregate',
        on=['colA'],
        aggregations=[Aggregation(aggfunction='avg', columns=['colB'], newcolumns=['avg_colB'])],
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
                Aggregation(aggfunction='min', columns=['colB'], newcolumns=['min_colB']),
            ],
        )


def test_multiple_aggregate(sample_df):
    df_result = AggregateStep(
        name='aggregate',
        on=['colA'],
        aggregations=[
            Aggregation(aggfunction='min', columns=['colB'], newcolumns=['min_colB']),
            Aggregation(aggfunction='max', columns=['colB'], newcolumns=['max_colB']),
        ],
    ).execute(sample_df, domain_retriever=None)

    assert_dataframes_equals(
        df_result,
        DataFrame({'colA': ['tata', 'toto', 'tutu'], 'min_colB': [3, 1, 2], 'max_colB': [3, 4, 2]}),
    )


def test_with_original_granularity(sample_df):
    df_result = AggregateStep(
        name='aggregate',
        keepOriginalGranularity=True,
        on=['colA'],
        aggregations=[
            Aggregation(aggfunction='min', columns=['colB'], newcolumns=['min_colB']),
        ],
    ).execute(sample_df, domain_retriever=None)

    print(df_result)
    assert_dataframes_equals(
        df_result,
        DataFrame(
            {
                'colA': ['toto', 'tutu', 'tata', 'toto'],
                'colB': [1, 2, 3, 4],
                'colC': [100, 50, 25, 0],
                'min_colB': [1, 2, 3, 1],
            }
        ),
    )


def test_with_original_granularity_multiple_aggregations(sample_df):
    df_result = AggregateStep(
        name='aggregate',
        keepOriginalGranularity=True,
        on=['colA'],
        aggregations=[
            Aggregation(aggfunction='min', columns=['colB'], newcolumns=['min_colB']),
            Aggregation(aggfunction='max', columns=['colC'], newcolumns=['max_colC']),
        ],
    ).execute(sample_df, domain_retriever=None)

    print(df_result)
    assert_dataframes_equals(
        df_result,
        DataFrame(
            {
                'colA': ['toto', 'tutu', 'tata', 'toto'],
                'colB': [1, 2, 3, 4],
                'colC': [100, 50, 25, 0],
                'min_colB': [1, 2, 3, 1],
                'max_colC': [100, 50, 25, 100],
            }
        ),
    )


def test_with_original_granularity_multiple_aggregations_multiple_columns(sample_df):
    df_result = AggregateStep(
        name='aggregate',
        keepOriginalGranularity=True,
        on=['colA'],
        aggregations=[
            Aggregation(
                aggfunction='min', columns=['colB', 'colC'], newcolumns=['min_colB', 'min_colC']
            ),
            Aggregation(aggfunction='max', columns=['colC'], newcolumns=['max_colC']),
        ],
    ).execute(sample_df, domain_retriever=None)

    print(df_result)
    assert_dataframes_equals(
        df_result,
        DataFrame(
            {
                'colA': ['toto', 'tutu', 'tata', 'toto'],
                'colB': [1, 2, 3, 4],
                'colC': [100, 50, 25, 0],
                'min_colB': [1, 2, 3, 1],
                'max_colC': [100, 50, 25, 100],
                'min_colC': [0, 50, 25, 0],
            }
        ),
    )
