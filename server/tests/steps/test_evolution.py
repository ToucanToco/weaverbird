import pytest
from pandas import DataFrame, to_datetime

from tests.utils import assert_dataframes_equals
from weaverbird.exceptions import DuplicateError
from weaverbird.steps import EvolutionStep


@pytest.fixture
def sample_df():
    return DataFrame(
        {
            'DATE': to_datetime(['2019-06', '2019-07', '2019-08', '2019-09', '2019-11', '2019-12']),
            'VALUE': [79, 81, 77, 75, 78, 88],
        }
    )


def test_evolution_absolute(sample_df: DataFrame):
    step = EvolutionStep(
        name='evolution',
        date_col='DATE',
        value_col='VALUE',
        evolution_type='vsLastMonth',
        evolution_format='abs',
    )
    df_result = step.execute(sample_df)

    expected_result = sample_df.assign(VALUE_EVOL_ABS=[None, 2, -4, -2, None, 10])
    assert_dataframes_equals(df_result, expected_result)


def test_evolution_percentage(sample_df: DataFrame):
    step = EvolutionStep(
        name='evolution',
        date_col='DATE',
        value_col='VALUE',
        evolution_type='vsLastMonth',
        evolution_format='pct',
    )
    df_result = step.execute(sample_df)

    expected_result = sample_df.assign(
        VALUE_EVOL_PCT=[None, 0.0253164, -0.0493827, -0.025974, None, 0.1282051]
    )
    assert_dataframes_equals(df_result, expected_result)


@pytest.fixture
def df_with_groups():
    return DataFrame(
        {
            'DATE': to_datetime(
                [
                    '2014-12',
                    '2015-12',
                    '2016-12',
                    '2017-12',
                    '2019-12',
                    '2020-12',
                    '2014-12',
                    '2015-12',
                    '2016-12',
                    '2017-12',
                    '2018-12',
                    '2020-12',
                ]
            ),
            'COUNTRY': ['France'] * 6 + ['USA'] * 6,
            'VALUE': [79, 81, 77, 75, 78, 88] + [74, 74, 73, 72, 75, 76],
        }
    )


def test_evolution_with_groups(df_with_groups: DataFrame):
    step = EvolutionStep(
        name='evolution',
        date_col='DATE',
        value_col='VALUE',
        evolution_type='vsLastYear',
        evolution_format='abs',
        index_columns=['COUNTRY'],
        new_column='MY_EVOL',
    )
    df_result = step.execute(df_with_groups)

    expected_result = df_with_groups.assign(
        MY_EVOL=[None, 2, -4, -2, None, 10, None, 0, -1, -1, 3, None]
    )
    assert_dataframes_equals(df_result, expected_result)


def test_evolution_with_duplicate_dates(df_with_groups: DataFrame):
    step = EvolutionStep(
        name='evolution',
        date_col='DATE',
        value_col='VALUE',
        evolution_type='vsLastYear',
        evolution_format='abs',
        new_column='MY_EVOL',
    )
    with pytest.raises(DuplicateError):
        step.execute(df_with_groups)
