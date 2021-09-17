import datetime
from datetime import timedelta

import pandas

from weaverbird.backends.pandas_executor.steps.convert import execute_convert
from weaverbird.pipeline.steps import ConvertStep


def test_benchmark_convert(benchmark):
    dates = [
        str(datetime.datetime.today() + timedelta(days=nb_day)) for nb_day in list(range(1, 2001))
    ]
    df = pandas.DataFrame(
        {
            'date': dates,
        }
    )
    step = ConvertStep(name='convert', columns=['date'], data_type='date')

    benchmark(execute_convert, step, df)


def test_convert_str_to_date():
    df = pandas.DataFrame(
        {
            'date': ['21/03/2006 21:50:00'],
        }
    )
    step = ConvertStep(name='convert', columns=['date'], data_type='date')
    result = execute_convert(step, df)
    date_result = result.at[0, 'date']
    assert str(date_result) == '2006-03-21 21:50:00'


def test_convert_timestamp_to_date():
    """
    Timestamps to date should support MilliSecond Timestamps (for consistency with Mongo Backend),
    not NanoSecond (Pandas default)
    """
    df = pandas.DataFrame(
        {
            'timestamp_ms': [1142977800000],
        }
    )
    step = ConvertStep(name='convert', columns=['timestamp_ms'], data_type='date')
    result = execute_convert(step, df)
    date_result = result.at[0, 'timestamp_ms']
    assert str(date_result) == '2006-03-21 21:50:00'


def test_convert_date_to_timestamp():
    """
    Date to timestamp should return MilliSecond Timestamps for opposite convertion consistency
    """
    df = pandas.DataFrame(
        {
            'date': [pandas.to_datetime('21/03/2006 21:50:00')],
        }
    )
    step = ConvertStep(name='convert', columns=['date'], data_type='integer')
    result = execute_convert(step, df)
    timestamp_result = result.at[0, 'date']
    assert str(timestamp_result) == '1142977800000'
