import random

import pytest
from pandas import DataFrame

from tests.utils import assert_dataframes_equals
from weaverbird.steps import UnpivotStep


@pytest.fixture
def sample_df():
    return DataFrame(
        {
            'COMPANY': ['Company 1', 'Company 2', 'Company 1', 'Company 2'],
            'COUNTRY': ['France', 'France', 'USA', 'USA'],
            'NB_CLIENTS': [7, 2, 12, 1],
            'REVENUES': [10, None, 6, 3],
        }
    )


def test_unpivot_with_dropna_true(sample_df: DataFrame):
    step = UnpivotStep(
        name='unpivot',
        keep=['COMPANY', 'COUNTRY'],
        unpivot=['NB_CLIENTS', 'REVENUES'],
        unpivot_column_name='KPI',
        value_column_name='VALUE',
        dropna=True,
    )
    result = step.execute(sample_df, domain_retriever=None, execute_pipeline=None)
    expected_result = DataFrame(
        {
            'COMPANY': [
                'Company 1',
                'Company 1',
                'Company 2',
                'Company 1',
                'Company 1',
                'Company 2',
                'Company 2',
            ],
            'COUNTRY': ['France'] * 3 + ['USA'] * 4,
            'KPI': [
                'NB_CLIENTS',
                'REVENUES',
                'NB_CLIENTS',
                'NB_CLIENTS',
                'REVENUES',
                'NB_CLIENTS',
                'REVENUES',
            ],
            'VALUE': [7, 10, 2, 12, 6, 1, 3],
        }
    )
    assert_dataframes_equals(result.sort_values(['COUNTRY', 'COMPANY', 'KPI']), expected_result)


def test_unpivot_with_dropna_false(sample_df: DataFrame):
    step = UnpivotStep(
        name='unpivot',
        keep=['COMPANY', 'COUNTRY'],
        unpivot=['NB_CLIENTS', 'REVENUES'],
        unpivot_column_name='KPI',
        value_column_name='VALUE',
        dropna=False,
    )
    result = step.execute(sample_df, domain_retriever=None, execute_pipeline=None)
    expected_result = DataFrame(
        {
            'COMPANY': ['Company 1'] * 2
            + ['Company 2'] * 2
            + ['Company 1'] * 2
            + ['Company 2'] * 2,
            'COUNTRY': ['France'] * 4 + ['USA'] * 4,
            'KPI': ['NB_CLIENTS', 'REVENUES'] * 4,
            'VALUE': [7, 10, 2, None, 12, 6, 1, 3],
        }
    )
    assert_dataframes_equals(result.sort_values(['COUNTRY', 'COMPANY', 'KPI']), expected_result)


def _make_benchmark_data():
    countries = ['France', 'USA']
    companies = ['Company_' + str(n) for n in range(1000)]
    columns = ['COMPANY', 'COUNTRY', 'NB_CLIENTS', 'REVENUES']

    data = []
    for company in companies:
        for country in countries:
            row = [company, country, random.randint(0, 250), random.randint(0, 50000)]
            data.append(row)

    return DataFrame(data, columns=columns)


def test_benchmark_unpivot(benchmark):
    df = _make_benchmark_data()

    step = UnpivotStep(
        name='unpivot',
        keep=['COMPANY', 'COUNTRY'],
        unpivot=['NB_CLIENTS', 'REVENUES'],
        unpivot_column_name='KPI',
        value_column_name='VALUE',
        dropna=False,
    )
    benchmark(step.execute, df)
