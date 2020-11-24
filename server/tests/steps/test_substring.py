import pandas as pd
import pytest

from tests.utils import assert_dataframes_equals
from weaverbird.steps.substring import SubstringStep


@pytest.fixture()
def sample_df():
    return pd.DataFrame(
        {
            'Label': ['foo', 'overflow', 'some_text', 'a_word', 'toucan', 'toco'],
            'Value:': [13, 7, 20, 1, 10, 5],
        }
    )


def test_substring_positive_start_end_idx(sample_df):
    result_df = SubstringStep(name='substring', column='Label', start_index=1, end_index=4).execute(
        sample_df
    )

    expected_df = pd.DataFrame(
        {
            'Label': ['foo', 'overflow', 'some_text', 'a_word', 'toucan', 'toco'],
            'Value:': [13, 7, 20, 1, 10, 5],
            'Label_SUBSTR': ['foo', 'over', 'some', 'a_wo', 'touc', 'toco'],
        }
    )
    assert_dataframes_equals(result_df, expected_df)


def test_substring_positive_start_negative_end(sample_df):
    result_df = SubstringStep(
        name='substring', column='Label', start_index=2, end_index=-2
    ).execute(sample_df)

    expected_df = pd.DataFrame(
        {
            'Label': ['foo', 'overflow', 'some_text', 'a_word', 'toucan', 'toco'],
            'Value:': [13, 7, 20, 1, 10, 5],
            'Label_SUBSTR': ['o', 'verflo', 'ome_tex', '_wor', 'ouca', 'oc'],
        }
    )
    assert_dataframes_equals(result_df, expected_df)


def test_substring_negative_start_negative_end(sample_df):
    result_df = SubstringStep(
        name='substring', column='Label', start_index=-3, end_index=-1
    ).execute(sample_df)

    expected_df = pd.DataFrame(
        {
            'Label': ['foo', 'overflow', 'some_text', 'a_word', 'toucan', 'toco'],
            'Value:': [13, 7, 20, 1, 10, 5],
            'Label_SUBSTR': ['foo', 'low', 'ext', 'ord', 'can', 'oco'],
        }
    )
    assert_dataframes_equals(result_df, expected_df)


def test_substring_new_column_name(sample_df):
    result_df = SubstringStep(
        name='substring', column='Label', start_index=-3, end_index=-1, newColumnName='FOO'
    ).execute(sample_df)

    expected_df = pd.DataFrame(
        {
            'Label': ['foo', 'overflow', 'some_text', 'a_word', 'toucan', 'toco'],
            'Value:': [13, 7, 20, 1, 10, 5],
            'FOO': ['foo', 'low', 'ext', 'ord', 'can', 'oco'],
        }
    )
    assert_dataframes_equals(result_df, expected_df)
