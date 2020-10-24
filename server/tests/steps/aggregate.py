import pytest
from pandas import DataFrame

from tests.utils import assert_dataframes_equals
from weaverbird.steps import FilterStep


@pytest.fixture
def sample_df():
    return DataFrame({'colA': ['toto', 'tutu', 'tata'], 'colB': [1, 2, 3], 'colC': [100, 50, 25]})


def test_simple_aggregate(sample_df):
    df_result = AggregateStep(
        name='aggregate',
        condition={
            'column': 'colA',
            'operation': 'sum',
            'name': 'result',
            'group_by': []
        },
    ).execute(sample_df, domain_retriever=None)

    assert_dataframes_equals(df_result, DataFrame({'result': [175]}))
