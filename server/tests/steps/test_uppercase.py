import pandas as pd

from tests.utils import assert_dataframes_equals
from weaverbird.steps.uppercase import UppercaseStep


def test_simple_uppercase():
    sample_df = pd.DataFrame({'values': ['foobar', 'flixbuz']})
    step = UppercaseStep(name='uppercase', column='values')
    result_df = step.execute(sample_df)
    expected_df = pd.DataFrame({'values': ['FOOBAR', 'FLIXBUZ']})

    assert_dataframes_equals(result_df, expected_df)


def test_utf8_uppercase():
    sample_df = pd.DataFrame({'values': ['foobar', 'óó']})
    step = UppercaseStep(name='uppercase', column='values')
    result_df = step.execute(sample_df)
    expected_df = pd.DataFrame({'values': ['FOOBAR', 'ÓÓ']})

    assert_dataframes_equals(result_df, expected_df)
