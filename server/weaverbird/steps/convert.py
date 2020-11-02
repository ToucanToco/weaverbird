from typing import List, Literal

from pandas import DataFrame, Series, to_datetime, to_numeric
from pydantic import Field

from weaverbird.steps.base import BaseStep

ColumnName = str


def cast_to_float(s: Series) -> Series:
    return to_numeric(s, errors='coerce')  # cast errors will result in NaN values


def cast_to_int(s: Series) -> Series:
    s = cast_to_float(s)
    # Since .astype(int) would fail on NaN values, treat them separately:
    s_integer = s[s.notna()].astype(int)
    s_nan = s[s.isna()]
    return s_integer.append(s_nan).sort_index()


def cast_to_str(s: Series) -> Series:
    return s.astype(str)


def cast_to_datetime(s: Series) -> Series:
    return to_datetime(s, errors='coerce')  # cast errors will result in NaT values


def cast_to_bool(s: Series) -> Series:
    return s.astype(bool)


CAST_FUNCTIONS = {
    'integer': cast_to_int,
    'float': cast_to_float,
    'text': cast_to_str,
    'date': cast_to_datetime,
    'boolean': cast_to_bool,
}


class ConvertStep(BaseStep):
    name = Field('convert', const=True)
    columns: List[ColumnName]
    data_type: Literal['integer', 'float', 'text', 'date', 'boolean']

    def execute(self, df: DataFrame, domain_retriever=None, execute_pipeline=None) -> DataFrame:
        cast_function = CAST_FUNCTIONS[self.data_type]
        transformed_columns = {col_name: cast_function(df[col_name]) for col_name in self.columns}
        return df.assign(**transformed_columns)
