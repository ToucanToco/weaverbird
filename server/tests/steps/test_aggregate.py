import numpy as np
import pytest
from pandas import DataFrame

from tests.utils import assert_dataframes_equals
from weaverbird.backends.pandas_executor.steps import execute_aggregate
from weaverbird.pipeline.steps import AggregateStep
from weaverbird.pipeline.steps.aggregate import Aggregation


@pytest.fixture
def sample_df():
    return DataFrame(
        {
            'Label': ['Label 1', 'Label 2', 'Label 3', 'Label 4', 'Label 5', 'Label 6'],
            'Group': ['Group 1'] * 3 + ['Group 2'] * 3,
            'Value1': [13, 7, 20, 1, 10, 5],
            'Value2': [10, 21, 4, 17, 12, 2],
        }
    )


def test_simple_aggregate(sample_df):
    step = AggregateStep(
        name='aggregate',
        on=['Group'],
        aggregations=[
            Aggregation(
                aggfunction='sum',
                columns=['Value1', 'Value2'],
                newcolumns=['Sum-Value1', 'Sum-Value2'],
            ),
            Aggregation(aggfunction='avg', columns=['Value1'], newcolumns=['Avg-Value1']),
        ],
    )
    df_result = execute_aggregate(step, sample_df)

    assert_dataframes_equals(
        df_result.sort_values(by=['Group']),
        DataFrame(
            {
                'Group': ['Group 1', 'Group 2'],
                'Sum-Value1': [40, 16],
                'Sum-Value2': [35, 31],
                'Avg-Value1': [np.average([13, 7, 20]), np.average([1, 10, 5])],
            }
        ).sort_values(by=['Group']),
    )


def test_with_original_granularity(sample_df):
    step = AggregateStep(
        name='aggregate',
        keepOriginalGranularity=True,
        on=['Group'],
        aggregations=[
            Aggregation(aggfunction='sum', columns=['Value1'], newcolumns=['Total']),
        ],
    )
    df_result = execute_aggregate(step, sample_df)

    assert_dataframes_equals(
        df_result,
        DataFrame(
            {
                'Label': ['Label 1', 'Label 2', 'Label 3', 'Label 4', 'Label 5', 'Label 6'],
                'Group': ['Group 1'] * 3 + ['Group 2'] * 3,
                'Value1': [13, 7, 20, 1, 10, 5],
                'Total': [40] * 3 + [16] * 3,
                'Value2': [10, 21, 4, 17, 12, 2],
            }
        ),
    )


def test_with_original_granularity_multiple_aggregations(sample_df):
    step = AggregateStep(
        name='aggregate',
        keepOriginalGranularity=True,
        on=['Group'],
        aggregations=[
            Aggregation(aggfunction='min', columns=['Value1'], newcolumns=['min_Value1']),
            Aggregation(aggfunction='max', columns=['Value2'], newcolumns=['max_Value2']),
        ],
    )
    df_result = execute_aggregate(step, sample_df)

    assert_dataframes_equals(
        df_result,
        DataFrame(
            {
                'Label': ['Label 1', 'Label 2', 'Label 3', 'Label 4', 'Label 5', 'Label 6'],
                'Group': ['Group 1'] * 3 + ['Group 2'] * 3,
                'Value1': [13, 7, 20, 1, 10, 5],
                'min_Value1': [7] * 3 + [1] * 3,
                'Value2': [10, 21, 4, 17, 12, 2],
                'max_Value2': [21] * 3 + [17] * 3,
            }
        ),
    )


def test_with_original_granularity_multiple_aggregations_multiple_columns(sample_df):
    step = AggregateStep(
        name='aggregate',
        keepOriginalGranularity=True,
        on=['Group'],
        aggregations=[
            Aggregation(
                aggfunction='min',
                columns=['Value1', 'Value2'],
                newcolumns=['min_Value1', 'min_Value2'],
            ),
            Aggregation(
                aggfunction='max',
                columns=['Value1', 'Value2'],
                newcolumns=['max_Value1', 'max_Value2'],
            ),
        ],
    )
    df_result = execute_aggregate(step, sample_df)

    assert_dataframes_equals(
        df_result,
        DataFrame(
            {
                'Label': ['Label 1', 'Label 2', 'Label 3', 'Label 4', 'Label 5', 'Label 6'],
                'Group': ['Group 1'] * 3 + ['Group 2'] * 3,
                'Value1': [13, 7, 20, 1, 10, 5],
                'min_Value1': [7] * 3 + [1] * 3,
                'max_Value1': [20] * 3 + [10] * 3,
                'Value2': [10, 21, 4, 17, 12, 2],
                'min_Value2': [4] * 3 + [2] * 3,
                'max_Value2': [21] * 3 + [17] * 3,
            }
        ),
    )


def test_count(sample_df):
    step = AggregateStep(
        name='aggregate',
        keepOriginalGranularity=False,
        on=['Group'],
        aggregations=[
            Aggregation(aggfunction='count', columns=['Label'], newcolumns=['count']),
        ],
    )
    df_result = execute_aggregate(step, sample_df)

    assert_dataframes_equals(
        df_result, DataFrame({'Group': ['Group 1', 'Group 2'], 'count': [3, 3]})
    )


def test_last(sample_df):
    step = AggregateStep(
        name='aggregate',
        keepOriginalGranularity=False,
        on=['Group'],
        aggregations=[
            Aggregation(aggfunction='last', columns=['Label'], newcolumns=['last_Label']),
        ],
    )
    df_result = execute_aggregate(step, sample_df)

    assert_dataframes_equals(
        df_result,
        DataFrame({'Group': ['Group 1', 'Group 2'], 'last_Label': ['Label 3', 'Label 6']}),
    )


def test_first(sample_df):
    step = AggregateStep(
        name='aggregate',
        keepOriginalGranularity=False,
        on=['Group'],
        aggregations=[
            Aggregation(aggfunction='first', columns=['Label'], newcolumns=['first_Label']),
        ],
    )
    df_result = execute_aggregate(step, sample_df)

    assert_dataframes_equals(
        df_result,
        DataFrame({'Group': ['Group 1', 'Group 2'], 'first_Label': ['Label 1', 'Label 4']}),
    )


def test_without_on(sample_df):
    step = AggregateStep(
        name='aggregate',
        keepOriginalGranularity=False,
        on=[],
        aggregations=[
            Aggregation(aggfunction='sum', columns=['Value1'], newcolumns=['sum_value']),
        ],
    )
    df_result = execute_aggregate(step, sample_df)

    assert_dataframes_equals(
        df_result,
        DataFrame({'sum_value': [56]}),
    )


def test_keep_original_granularity_empty_on(sample_df):
    step = AggregateStep(
        name='aggregate',
        on=[],
        keepOriginalGranularity=True,
        aggregations=[
            Aggregation(aggfunction='count', columns=['Group'], newcolumns=['__vqb_count__']),
        ],
    )
    df_result = execute_aggregate(step, sample_df)

    assert_dataframes_equals(df_result, sample_df.assign(__vqb_count__=6))


def test_legacy_syntax(sample_df):
    step = AggregateStep(
        name='aggregate',
        keepOriginalGranularity=False,
        on=[],
        aggregations=[
            Aggregation(**{'aggfunction': 'sum', 'column': 'Value1', 'newcolumn': 'sum_value'}),
        ],
    )
    df_result = execute_aggregate(step, sample_df)

    assert_dataframes_equals(
        df_result,
        DataFrame({'sum_value': [56]}),
    )


def test_count_distinct(sample_df):
    step = AggregateStep(
        name='aggregate',
        keepOriginalGranularity=False,
        on=[],
        aggregations=[
            Aggregation(
                aggfunction='count distinct',
                columns=['Group'],
                newcolumns=['Group_CD'],
            )
        ],
    )
    df_result = execute_aggregate(step, sample_df)

    assert_dataframes_equals(df_result, DataFrame({'Group_CD': [2]}))


def test_simple_aggregate_with_null():
    df = DataFrame(
        {
            'Label': ['Label 1', 'Label 2', 'Label 3', 'Label 4', 'Label 5', 'Label 6'],
            'Group': ['Group 1'] * 3 + [None] * 3,  # type: ignore
            'Value1': [13, 7, 20, 1, 10, 5],
        }
    )
    step = AggregateStep(
        name='aggregate',
        on=['Group'],
        aggregations=[
            Aggregation(
                aggfunction='sum',
                columns=['Value1'],
                newcolumns=['Sum-Value1'],
            ),
        ],
    )
    df_result = execute_aggregate(step, df)

    assert_dataframes_equals(
        df_result.sort_values(by=['Group']),
        DataFrame(
            {
                'Group': ['Group 1', None],
                'Sum-Value1': [40, 16],
            }
        ).sort_values(by=['Group']),
    )


def test_count_with_null():
    df = DataFrame(
        {
            'Label': ['Label 1', 'Label 2', 'Label 3', 'Label 4', 'Label 5', 'Label 6'],
            'Group': ['Group 1'] * 3 + [None] * 3,  # type: ignore
            'Value1': [13, 7, 20, 1, 10, 5],
        }
    )
    step = AggregateStep(
        name='aggregate',
        on=['Group'],
        aggregations=[
            Aggregation(
                aggfunction='count distinct including empty',
                columns=['Group'],
                newcolumns=['__VQB_COUNT'],
            ),
        ],
    )
    df_result = execute_aggregate(step, df)

    assert_dataframes_equals(
        df_result.sort_values(by=['Group']),
        DataFrame(
            {
                'Group': ['Group 1', np.nan],
                '__VQB_COUNT': [3, 3],
            }
        ).sort_values(by=['Group']),
    )


def test_benchmark_aggregate(benchmark):
    sample_df = DataFrame(
        {
            'Group': ['Group 1'] * 500 + ['Group 2'] * 500,
            'Value1': np.random.random(1000),
            'Value2': np.random.random(1000),
        }
    )
    step = AggregateStep(
        name='aggregate',
        on=['Group'],
        aggregations=[
            Aggregation(
                aggfunction='avg',
                columns=['Value1'],
                newcolumns=['RESULT'],
            ),
        ],
    )
    benchmark(execute_aggregate, step, sample_df)
