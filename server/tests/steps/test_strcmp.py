import pandas as pd

from tests.utils import assert_dataframes_equals
from weaverbird.steps.strcmp import CompareTextStep


def test_strcmp():
    df = pd.DataFrame(
        {'TEXT_1': ['Bbb', 'Bbb', 'Bbb', 'Bbb'], 'TEXT_2': ['bbb', 'Bbb', 'Aaa', 'cc']}
    )

    df_result = CompareTextStep(
        name='strcmp',
        newColumnName='RESULT',
        strCol1='TEXT_1',
        strCol2='TEXT_2',
    ).execute(df)

    expected_result = df.assign(**{'RESULT': [False, True, False, False]})
    assert_dataframes_equals(df_result, expected_result)
