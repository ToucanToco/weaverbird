import pytest
from pandas import DataFrame

from tests.utils import assert_dataframes_equals
from weaverbird.steps.argmin import ArgminStep


@pytest.fixture
def sample_df():
    return DataFrame(
        {
            'label': ['label1', 'label2', 'label3', 'label4', 'label5', 'label6'],
            'group': ['group 1', 'group 1', 'group 1', 'group 2', 'group 2', 'group 2'],
            'value': [13, 7, 20, 1, 10, 5],
        }
    )


def test_simple_argmin(sample_df):
    step = ArgminStep(name='argmin', column='value')
    result = step.execute(sample_df, domain_retriever=None)
    assert_dataframes_equals(
        result,
        DataFrame(
            {
                'label': ['label4'],
                'group': ['group 2'],
                'value': [1],
            }
        ),
    )


def test_argmin_with_group(sample_df):
    step = ArgminStep(name='argmin', column='value', groups=['group'])
    result = step.execute(sample_df, domain_retriever=None)
    assert_dataframes_equals(
        result,
        DataFrame(
            {
                'label': ['label2', 'label4'],
                'group': ['group 1', 'group 2'],
                'value': [7, 1],
            }
        ),
    )
