import re
from collections import defaultdict
from typing import DefaultDict

from pandas import DataFrame

from weaverbird.types import ColumnName

REGEX_COLUMN_NAME_WITH_SUFFIX = re.compile(r'(.*)_(\d+)')


def rename_duplicated_columns(df: DataFrame) -> DataFrame:
    """
    If a dataframe has several columns with the same name,
    adds a suffix to the duplicates (_1, _2, etc.)
    (the first occurrence remains without suffix)
    If there are already some columns suffixed with numbers
    in the dataframe, then the new suffix numbers will start
    after the current maximum.
    E.g: columns ['foo', 'foo_2', 'foo'] -> ['foo', 'foo_2', 'foo_3']

    Processes inplace.
    """
    old_cols = list(df.columns)
    max_suffix: DefaultDict[ColumnName, int] = defaultdict(lambda: 0)

    # First step: find the current max suffix for each column name
    for column in old_cols:
        if match := REGEX_COLUMN_NAME_WITH_SUFFIX.fullmatch(column):
            column_basename, suffix = match.groups()
            suffix = int(suffix)
        else:
            column_basename, suffix = column, 0
        max_suffix[column_basename] = max(max_suffix[column_basename], suffix + 1)

    new_cols = []

    def _find_new_name_for_column(column: str) -> str:
        if column not in new_cols:
            return column

        if match := REGEX_COLUMN_NAME_WITH_SUFFIX.fullmatch(column):
            column_basename, suffix = match.groups()
            new_suffix = max_suffix[column_basename]
        else:
            column_basename, new_suffix = column, max_suffix[column]
        new_column = f'{column_basename}_{new_suffix}'
        max_suffix[column_basename] += 1  # increment the current max suffix
        return new_column

    # Second step: use this max suffix to rename the columns where needed:
    for column in old_cols:
        new_col = _find_new_name_for_column(column)
        new_cols.append(new_col)

    # Edit the column names (inplace):
    df.columns = new_cols
    return df
