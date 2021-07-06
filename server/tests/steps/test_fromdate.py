from datetime import datetime, timedelta

import pytest
from pandas import DataFrame, to_datetime

from tests.utils import assert_dataframes_equals
from weaverbird.backends.pandas_executor.steps.fromdate import execute_fromdate
from weaverbird.pipeline.steps import FromdateStep


@pytest.fixture
def sample_df():
    return DataFrame(
        {
            'a_date': to_datetime(
                [
                    '2019-10-06T01:02:03.004Z',
                    '2019-10-07T00:00:00.000Z',
                    '2020-11-16T00:00:00.000Z',
                    None,
                ]
            )
        }
    )


def test_simple_fromdate(sample_df):
    step = FromdateStep(name='fromdate', column='a_date', format='%Y-%m-%d')
    result = execute_fromdate(step, sample_df, domain_retriever=None, execute_pipeline=None)
    assert_dataframes_equals(
        result,
        DataFrame({'a_date': ['2019-10-06', '2019-10-07', '2020-11-16', None]}),
    )


def test_benchmark_fromdate(benchmark):
    dates = [datetime.today() + timedelta(days=nb_day) for nb_day in list(range(1, 2001))]
    df = DataFrame(
        {
            'date': dates,
        }
    )
    step = FromdateStep(name='fromdate', column='date', format='%Y-%m-%d')
    benchmark(execute_fromdate, step, df)
