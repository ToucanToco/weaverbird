from typing import Literal, Optional

from pandas import DataFrame
from pydantic import Field

from weaverbird.steps.base import BaseStep

OPERATIONS_MAPPING = {
    'minutes': 'minute',
    'seconds': 'second',
    'dayOfYear': 'dayofyear',
}


class DateExtractStep(BaseStep):
    name = Field('dateextract', const=True)
    column: str
    operation: Literal[
        'year',
        'month',
        'day',
        'hour',
        'minutes',
        'seconds',
        'milliseconds',
        'dayOfYear',
        'dayOfWeek',
        'week',
    ]
    new_column_name: Optional[str]

    def execute(self, df: DataFrame, domain_retriever=None, execute_pipeline=None) -> DataFrame:
        dst_column = self.new_column_name or f'{self.column}_{self.operation}'
        serie_dt = df[self.column].dt
        if self.operation == 'week':
            result = serie_dt.isocalendar().week
        elif self.operation == 'milliseconds':
            result = serie_dt.microsecond / 1000
        elif self.operation == 'dayOfWeek':
            # result should be between 1 (sunday) and 7 (saturday)
            result = (serie_dt.dayofweek + 2) % 7
            result = result.replace({0: 7})
        else:
            operation = OPERATIONS_MAPPING.get(self.operation, self.operation)
            result = getattr(serie_dt, operation)

        return df.assign(**{dst_column: result})
