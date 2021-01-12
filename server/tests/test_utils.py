from pandas import DataFrame

from weaverbird.utils import rename_duplicated_columns


def test_rename_duplicated_columns():
    columns = ['plop', 'foo', 'bar', 'foo', 'foo', 'bar', 'plip']
    df = DataFrame(columns=columns)
    assert (df.columns == columns).all()

    df_renamed = rename_duplicated_columns(df)
    expected_columns = ['plop', 'foo', 'bar', 'foo_1', 'foo_2', 'bar_1', 'plip']
    assert (df_renamed.columns == expected_columns).all()
