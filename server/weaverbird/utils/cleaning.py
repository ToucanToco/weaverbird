from collections import defaultdict
from typing import DefaultDict

from pandas import DataFrame

from weaverbird.types import ColumnName


def rename_duplicated_columns(df: DataFrame) -> DataFrame:
    """
    If a dataframe has several columns with the same name,
    adds a suffix to the duplicates (_1, _2, etc.)
    (the first occurrence remains without suffix)

    Processes inplace.
    """
    cols = []
    count: DefaultDict[ColumnName, int] = defaultdict(lambda: 0)
    for column in df.columns:
        nb_duplicate = count[column]
        if nb_duplicate == 0:
            cols.append(column)
        else:
            cols.append(f'{column}_{nb_duplicate}')
        count[column] += 1
    df.columns = cols
    return df
