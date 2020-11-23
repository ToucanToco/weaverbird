import pandas as pd

from tests.utils import assert_dataframes_equals
from weaverbird.steps.aggregate import Aggregation
from weaverbird.steps.totals import TotalDimension, TotalsStep


def test_single_totals_without_groups():
    sample_df = pd.DataFrame(
        {
            'COUNTRY': ['France', 'USA'] * 4,
            'PRODUCT': (['PRODUCT A'] * 2 + ['PRODUCT B'] * 2) * 2,
            'YEAR': ['2019'] * 4 + ['2020'] * 4,
            'VALUE': [5, 10, 10, 15, 20, 20, 30, 25],
        }
    )
    step = TotalsStep(
        name='totals',
        total_dimensions=[TotalDimension(total_column='COUNTRY', total_rows_label='All countries')],
        aggregations=[Aggregation(columns=['VALUE'], aggfunction='sum', newcolumns=['VALUE'])],
        groups=[],
    )

    expected_result = pd.concat(
        [
            sample_df,
            pd.DataFrame(
                {'COUNTRY': 'All countries', 'PRODUCT': [None], 'YEAR': [None], 'VALUE': [135]}
            ),
        ]
    )

    real_result = step.execute(sample_df)
    assert_dataframes_equals(real_result, expected_result)


def test_totals_2():
    sample_df = pd.DataFrame(
        {
            'COUNTRY': ['France', 'USA'] * 4,
            'PRODUCT': (['product A'] * 2 + ['product B'] * 2) * 2,
            'YEAR': ['2019'] * 4 + ['2020'] * 4,
            'VALUE_1': [5, 10, 10, 15, 20, 20, 30, 25],
            'VALUE_2': [50, 100, 100, 150, 200, 200, 300, 250],
        }
    )
    step = TotalsStep(
        name='totals',
        total_dimensions=[
            TotalDimension(total_column='COUNTRY', total_rows_label='All countries'),
            TotalDimension(total_column='PRODUCT', total_rows_label='All products'),
        ],
        aggregations=[
            Aggregation(
                columns=['VALUE_1', 'VALUE_2'],
                aggfunction='sum',
                newcolumns=['VALUE_1-sum', 'VALUE_2'],
            ),
            Aggregation(columns=['VALUE_1'], aggfunction='avg', newcolumns=['VALUE_1-avg']),
        ],
        groups=['YEAR'],
    )

    expected_result = sample_df.copy()
    expected_result['VALUE_1-sum'] = expected_result['VALUE_1-avg'] = expected_result['VALUE_1']
    del expected_result['VALUE_1']
    expected_result = pd.concat(
        [
            expected_result,
            pd.DataFrame(
                {
                    'COUNTRY': ['USA', 'France'] * 2 + ['All countries'] * 6,
                    'PRODUCT': ['All products'] * 4
                    + ['product B', 'product A'] * 2
                    + ['All products'] * 2,
                    'YEAR': (['2020'] * 2 + ['2019'] * 2) * 2 + ['2020', '2019'],
                    'VALUE_2': [450, 500, 250, 150, 550, 400, 250, 150, 950, 400],
                    'VALUE_1-sum': [45, 50, 25, 15, 55, 40, 25, 15, 95, 40],
                    'VALUE_1-avg': [22.5, 25, 12.5, 7.5, 27.5, 20, 12.5, 7.5, 23.75, 10],
                }
            ),
        ]
    )

    real_result = step.execute(sample_df)
    real_sorted = real_result.sort_values(by=real_result.columns.tolist())
    expected_sorted = expected_result.sort_values(by=expected_result.columns.tolist())
    assert_dataframes_equals(real_sorted, expected_sorted)
