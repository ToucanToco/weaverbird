import pytest
from pandas import DataFrame

from tests.utils import assert_dataframes_equals
from weaverbird.steps.argmin import ArgminStep


@pytest.fixture
def sample_df():
    return DataFrame(
        {'colA': ['toto', 'tutu', 'tata', 'toto'], 'colB': [1, 2, 3, 4], 'colC': [100, 50, 25, 0]}
    )


def test_simple_argmax(sample_df):
    step = ArgminStep(name='argmin', column='colB')
    result = step.execute(sample_df, domain_retriever=None)
    assert_dataframes_equals(
        result,
        DataFrame(
            {
                'colA': ['toto', 'tutu', 'tata', 'toto'],
                'colB': [1, 1, 1, 1],
                'colC': [100, 50, 25, 0],
            }
        ),
    )


def test_argmax_with_group(sample_df):
    step = ArgminStep(name='argmin', column='colB', groups=['colA'])
    result = step.execute(sample_df, domain_retriever=None)
    assert_dataframes_equals(
        result,
        DataFrame(
            {
                'colA': ['toto', 'tutu', 'tata', 'toto'],
                'colB': [1, 2, 3, 1],
                'colC': [100, 50, 25, 0],
            }
        ),
    )
