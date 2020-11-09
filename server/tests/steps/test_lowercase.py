import pandas as pd
import pytest

from tests.utils import assert_dataframes_equals
from weaverbird.steps.lowercase import LowercaseStep


@pytest.fixture()
def sample_df() -> pd.DataFrame:
    return pd.DataFrame({'a_text': ['FOO', 'BAR', 'baz'], 'an_int': [1, 2, 3]})


def test_simple_lowercase(sample_df):
    step = LowercaseStep(name='lowercase', column='a_text')
    result_df = step.execute(sample_df)
    expected_df = pd.DataFrame({'a_text': ['foo', 'bar', 'baz'], 'an_int': [1, 2, 3]})
    assert_dataframes_equals(result_df, expected_df)


def test_it_should_throw_if_applied_on_wrong_type(sample_df):
    with pytest.raises(AttributeError):
        step = LowercaseStep(name='lowercase', column='an_int')
        step.execute(sample_df)
