import pytest
from pandas import DataFrame, to_datetime

from tests.utils import assert_dataframes_equals
from weaverbird.steps import DateExtractStep


@pytest.fixture
def sample_df():
    return DataFrame(
        {
            'date': to_datetime(
                [
                    '2019-10-06T01:02:03.004Z',
                    '2019-10-07T00:00:00.000Z',
                    '2020-11-16T00:00:00.000Z',
                    None,
                ]
            )
        }
    )


def test_date_extract(sample_df: DataFrame):
    df_result = DateExtractStep(
        name='dateextract', column='date', operation='day', new_column_name='date'
    ).execute(sample_df)
    expected_result = DataFrame({'date': [6, 7, 16, None]})
    assert_dataframes_equals(df_result, expected_result)

    df_result = DateExtractStep(
        name='dateextract', column='date', operation='milliseconds', new_column_name='date'
    ).execute(sample_df)
    expected_result = DataFrame({'date': [4, 0, 0, None]})
    assert_dataframes_equals(df_result, expected_result)

    df_result = DateExtractStep(
        name='dateextract', column='date', operation='week', new_column_name='date'
    ).execute(sample_df)
    expected_result = DataFrame({'date': [40, 41, 47, None]})
    assert_dataframes_equals(df_result, expected_result)

    df_result = DateExtractStep(
        name='dateextract', column='date', operation='dayOfWeek', new_column_name='date'
    ).execute(sample_df)
    expected_result = DataFrame({'date': [1, 2, 2, None]})
    assert_dataframes_equals(df_result, expected_result)
