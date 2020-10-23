from pandas import DataFrame

from tests.utils import assert_dataframes_equals
from weaverbird.steps import FilterStep


def test_simple_eq_filter():
    df = DataFrame({'colA': ['toto', 'tutu', 'tata'], 'colB': [1, 2, 3], 'colC': [100, 50, 25]})

    df_result = FilterStep(
        name='filter',
        condition={
            'column': 'colA',
            'operator': 'eq',
            'value': 'tutu',
        },
    ).execute(df, domain_retriever=None)

    assert_dataframes_equals(df_result, DataFrame({'colA': ['tutu'], 'colB': [2], 'colC': [50]}))
