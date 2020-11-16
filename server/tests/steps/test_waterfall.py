import pandas as pd
from tests.utils import assert_dataframes_equals
from weaverbird.steps.waterfall import WaterfallStep


def test_simple():
    sample_df = pd.DataFrame(
        {
            'city': ['Bordeaux', 'Boston', 'Paris', 'New-York'] * 2,
            'year': [2019] * 4 + [2018] * 4,
            'revenue': [135, 275, 115, 450, 98, 245, 103, 385]
        }
    )
    result_df = WaterfallStep(name='waterfall',
                              valueColumn='revenue',
                              milestonesColumn='year',
                              start=2018, end=2019,
                              labelsColumn='city',
                              sortBy='value',
                              order='desc').execute(sample_df)

    expected_df = pd.DataFrame(
        {
            'LABEL_waterfall': [2018, 'Paris', 'Bordeaux', 'Boston', 'New-York', 2019],
            'TYPE_waterfall': [None, 'parent', 'parent', 'parent', 'parent', None],
            'revenue': [831, 65, 37, 30, 12, 975]
        })

    assert_dataframes_equals(result_df, expected_df)
