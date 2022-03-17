import pytest
from pandas import DataFrame, Timestamp

from tests.utils import assert_dataframes_equals
from weaverbird.backends.pandas_executor.steps.todate import execute_todate
from weaverbird.pipeline.steps import ToDateStep

@pytest.fixture
def sample_df():
    return DataFrame({'a_date': ['06/10/2019', '07/10/2019', '08/10/2019', None]})


def test_todate(sample_df: DataFrame):
    step = ToDateStep(name='todate', column='a_date', format='%d/%m/%Y')
    result = execute_todate(step, sample_df)
    assert_dataframes_equals(
        result,
        DataFrame(
            {
                'a_date': [
                    Timestamp(year=2019, month=10, day=6),
                    Timestamp(year=2019, month=10, day=7),
                    Timestamp(year=2019, month=10, day=8),
                    None,
                ]
            }
        ),
    )


def test_todate_automatic_guess(sample_df: DataFrame):
    step = ToDateStep(name='todate', column='a_date')
    result = execute_todate(step, sample_df)
    assert_dataframes_equals(
        result,
        DataFrame(
            {
                'a_date': [
                    # Pandas thinks the format is '%m/%d/%Y':
                    Timestamp(year=2019, month=6, day=10),
                    Timestamp(year=2019, month=7, day=10),
                    Timestamp(year=2019, month=8, day=10),
                    None,
                ]
            }
        ),
    )


def test_todate_int_as_year_with_automatic_guess():
    sample_df = DataFrame({'a_date': [2019, 2020]})
    step = ToDateStep(name='todate', column='a_date')
    result = execute_todate(step, sample_df)
    assert_dataframes_equals(
        result,
        DataFrame(
            {
                'a_date': [
                    # We force Pandas to format with %Y:
                    Timestamp(year=2019, month=1, day=1),
                    Timestamp(year=2020, month=1, day=1),
                ]
            }
        ),
    )


def test_todate_from_str_timestamp():
    """
    Timestamps to date should support MilliSecond Timestamps (for consistency with Mongo Backend),
    not NanoSecond (Pandas default)
    """
    df = DataFrame(
        {
            'timestamp_ms': [1142977800000],
        }
    )
    step = ToDateStep(name='todate', column='timestamp_ms')
    result = execute_todate(step, df)
    date_result = result.at[0, 'timestamp_ms']
    assert str(date_result) == '2006-03-21 21:50:00'

