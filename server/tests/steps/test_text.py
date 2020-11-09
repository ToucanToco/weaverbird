import pytest
from pandas import DataFrame

from tests.utils import assert_dataframes_equals
from weaverbird.steps import TextStep


@pytest.fixture
def sample_df():
    return DataFrame({'NAME': ['foo', 'bar'], 'AGE': [42, 43], 'SCORE': [100, 200]})


def test_text(sample_df: DataFrame):
    df_result = TextStep(
        name='text', new_column='BEST SINGER EVER', text='jean-jacques-goldman'
    ).execute(sample_df)

    expected_result = DataFrame(
        {
            'NAME': ['foo', 'bar'],
            'AGE': [42, 43],
            'SCORE': [100, 200],
            'BEST SINGER EVER': ['jean-jacques-goldman', 'jean-jacques-goldman'],
        }
    )
    assert_dataframes_equals(df_result, expected_result)
