from pandas import DataFrame

from tests.utils import assert_dataframes_equals
from weaverbird.steps import CumSumStep


def test_cumsum():
    sample_df = DataFrame(
        {
            'date': ['2019-01', '2019-02', '2019-03', '2019-04', '2019-05', '2019-06'],
            'value': [2, 5, 3, 8, 9, 6],
        }
    )

    df_result = CumSumStep(name='cumsum', value_column='value', reference_column='date').execute(
        sample_df
    )

    expected_result = DataFrame(
        {
            'date': ['2019-01', '2019-02', '2019-03', '2019-04', '2019-05', '2019-06'],
            'value': [2, 5, 3, 8, 9, 6],
            'value_CUMSUM': [2, 7, 10, 18, 27, 33],
        }
    )
    assert_dataframes_equals(df_result, expected_result)


def test_cumsum_with_groups():
    sample_df = DataFrame(
        {
            'date': ['2019-01', '2019-02', '2019-03', '2019-04', '2019-05', '2019-06'] * 2,
            'country': ['France'] * 6 + ['USA'] * 6,
            'value': [2, 5, 3, 8, 9, 6] + [10, 6, 6, 4, 8, 7],
        }
    )

    df_result = CumSumStep(
        name='cumsum',
        value_column='value',
        reference_column='date',
        groupby=['country'],
        new_column='my_cumsum',
    ).execute(sample_df)

    expected_result = DataFrame(
        {
            'date': ['2019-01', '2019-02', '2019-03', '2019-04', '2019-05', '2019-06'] * 2,
            'country': ['France'] * 6 + ['USA'] * 6,
            'value': [2, 5, 3, 8, 9, 6] + [10, 6, 6, 4, 8, 7],
            'my_cumsum': [2, 7, 10, 18, 27, 33] + [10, 16, 22, 26, 34, 41],
        }
    )
    assert_dataframes_equals(df_result, expected_result)
