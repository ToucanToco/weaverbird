import pandas as pd

from tests.utils import assert_dataframes_equals
from weaverbird.steps.waterfall import WaterfallStep


def test_simple():
    sample_df = pd.DataFrame(
        {
            'city': ['Bordeaux', 'Boston', 'New-York', 'Paris'] * 2,
            'year': [2019] * 4 + [2018] * 4,
            'revenue': [135, 275, 115, 450, 98, 245, 103, 385],
        }
    )
    result_df = WaterfallStep(
        name='waterfall',
        valueColumn='revenue',
        milestonesColumn='year',
        start=2018,
        end=2019,
        labelsColumn='city',
        sortBy='value',
        order='desc',
    ).execute(sample_df)

    expected_df = pd.DataFrame(
        {
            'LABEL_waterfall': ['2018', 'Paris', 'Bordeaux', 'Boston', 'New-York', '2019'],
            'TYPE_waterfall': [None, 'Parent', 'Parent', 'Parent', 'Parent', None],
            'revenue': [831, 65, 37, 30, 12, 975],
        }
    )

    assert_dataframes_equals(result_df, expected_df)


def test_with_groups():
    sample_df = pd.DataFrame(
        {
            'city': (['Bordeaux'] * 2 + ['Paris'] * 2 + ['Boston'] * 2 + ['New-York'] * 2) * 2,
            'country': (['France'] * 4 + ['USA'] * 4) * 2,
            'product': ['product1', 'product2'] * 8,
            'year': [2019] * 8 + [2018] * 8,
            'revenue': [65, 70, 210, 240, 130, 145, 55, 60, 38, 60, 175, 210, 95, 150, 50, 53],
        }
    )
    result_df = WaterfallStep(
        name='waterfall',
        valueColumn='revenue',
        milestonesColumn='year',
        start=2018,
        end=2019,
        labelsColumn='city',
        parentsColumn='country',
        groupby=['product'],
        sortBy='label',
        order='asc',
    ).execute(sample_df)

    expected_df = pd.DataFrame(
        {
            'LABEL_waterfall': ['2018'] * 2
            + ['Bordeaux'] * 2
            + ['Boston'] * 2
            + ['France'] * 2
            + ['New-York'] * 2
            + ['Paris'] * 2
            + ['USA'] * 2
            + ['2019'] * 2,
            'GROUP_waterfall': ['2018'] * 2
            + ['France'] * 2
            + ['USA'] * 2
            + ['France'] * 2
            + ['USA'] * 2
            + ['France'] * 2
            + ['USA'] * 2
            + ['2019'] * 2,
            'TYPE_waterfall': [None, None, 'child']
            + ['child'] * 3
            + ['parent'] * 2
            + ['child'] * 4
            + ['parent']
            + ['parent', None, None],
            'product': ['product1', 'product2'] * 3
            + ['product2', 'product1']
            + ['product1', 'product2'] * 2
            + ['product2', 'product1'] * 2,
            'revenue': [358, 473, 27, 10, 35, -5, 40, 62, 5, 7, 35, 30, 2, 40, 515, 460],
        }
    )
    assert_dataframes_equals(
        expected_df.sort_values(by='revenue'), result_df.sort_values(by='revenue')
    )
