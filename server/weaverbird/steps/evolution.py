from typing import List, Literal, Optional

from pandas import DataFrame, DateOffset
from pydantic import Field

from weaverbird.exceptions import DuplicateError
from weaverbird.steps.base import BaseStep

EVOLUTION_TYPE = Literal['vsLastYear', 'vsLastMonth', 'vsLastWeek', 'vsLastDay']
EVOLUTION_FORMAT = Literal['abs', 'pct']


OFFSETS = {
    'vsLastYear': DateOffset(years=1),
    'vsLastMonth': DateOffset(months=1),
    'vsLastWeek': DateOffset(weeks=1),
    'vsLastDay': DateOffset(days=1),
}


class EvolutionStep(BaseStep):
    name = Field('evolution', const=True)
    date_col: str = Field(alias='dateCol')
    value_col: str = Field(alias='valueCol')
    evolution_type: EVOLUTION_TYPE = Field(alias='evolutionType')
    evolution_format: EVOLUTION_FORMAT = Field(alias='evolutionFormat')
    index_columns: List[str] = Field([], alias='indexColumns')
    new_column: Optional[str] = Field(alias='newColumn')

    class Config:
        allow_population_by_field_name = True

    def execute(self, df: DataFrame, domain_retriever=None, execute_pipeline=None) -> DataFrame:
        new_column = self.new_column or f'{self.value_col}_EVOL_{self.evolution_format.upper()}'

        id_cols = [self.date_col] + self.index_columns
        if df.set_index(id_cols).index.duplicated().any():
            raise DuplicateError('Multiple rows for the same date. Did you forget indexColumns?')

        date_col_offseted = df[self.date_col] + OFFSETS[self.evolution_type]
        df_offseted = df.assign(**{self.date_col: date_col_offseted})
        both = df.merge(df_offseted, on=id_cols, how='left', suffixes=(None, '_prev_date'))
        value_date, value_prev_date = both[self.value_col], both[f'{self.value_col}_prev_date']

        if self.evolution_format == 'abs':
            evolution = value_date - value_prev_date
        elif self.evolution_format == 'pct':
            evolution = value_date / value_prev_date - 1

        return df.assign(**{new_column: evolution})
