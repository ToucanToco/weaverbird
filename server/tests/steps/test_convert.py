import pytest
from pandas import DataFrame

from tests.utils import assert_dataframes_equals
from weaverbird.steps import ConvertStep


@pytest.fixture
def sample_df() -> DataFrame:
    return DataFrame({'value': [41, '42', 43.5, '43.6', None, 'meh']})


def test_convert_to_float(sample_df: DataFrame):
    df_result = ConvertStep(name='convert', columns=['value'], data_type='float').execute(sample_df)

    expected_result = DataFrame({'value': [41.0, 42.0, 43.5, 43.6, None, None]})
    assert_dataframes_equals(df_result, expected_result)


def test_convert_to_integer(sample_df: DataFrame):
    df_result = ConvertStep(name='convert', columns=['value'], data_type='integer').execute(
        sample_df
    )

    expected_result = DataFrame({'value': [41, 42, 43, 43, None, None]})
    assert_dataframes_equals(df_result, expected_result)


def test_convert_to_text(sample_df: DataFrame):
    df_result = ConvertStep(name='convert', columns=['value'], data_type='text').execute(sample_df)

    expected_result = DataFrame({'value': ['41', '42', '43.5', '43.6', 'nan', 'meh']})
    assert_dataframes_equals(df_result, expected_result)
