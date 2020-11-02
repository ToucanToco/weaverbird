from pandas import DataFrame

from tests.utils import assert_dataframes_equals
from weaverbird.steps import ConvertStep


def test_convert_to_float():
    df_result = ConvertStep(name='convert', columns=['value'], data_type='float').execute(
        DataFrame({'value': [41, '42', 43.5, '43.6', None, 'meh']})
    )

    expected_result = DataFrame({'value': [41.0, 42.0, 43.5, 43.6, None, None]})
    assert_dataframes_equals(df_result, expected_result)


def test_convert_to_int():
    df_result = ConvertStep(name='convert', columns=['value'], data_type='integer').execute(
        DataFrame({'value': [41, '42', 43.5, '43.6', None, 'meh']})
    )

    expected_result = DataFrame({'value': [41, 42, 43, 43, None, None]})
    assert_dataframes_equals(df_result, expected_result)
