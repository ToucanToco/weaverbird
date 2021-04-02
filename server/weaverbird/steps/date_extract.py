from typing import List, Literal, Optional, Union

from pandas import DataFrame, to_datetime, to_timedelta
from pydantic import Field

from weaverbird.render_variables import StepWithVariablesMixin
from weaverbird.steps.base import BaseStep
from weaverbird.types import ColumnName

BASIC_DATE_PARTS = Literal[
    'year',
    'month',
    'day',
    'week',
    'quarter',
    'dayOfWeek',
    'dayOfYear',
    'isoYear',
    'isoWeek',
    'isoDayOfWeek',
    'hour',
    'minutes',
    'seconds',
    'milliseconds',
]

DATE_INFO = Union[
    BASIC_DATE_PARTS,
    Literal[
        'firstDayOfYear',
        'firstDayOfMonth',
        'firstDayOfWeek',
        'firstDayOfQuarter',
        'firstDayOfIsoWeek',
        'previousDay',
        'firstDayOfPreviousYear',
        'firstDayOfPreviousMonth',
        'firstDayOfPreviousWeek',
        'firstDayOfPreviousQuarter',
        'firstDayOfPreviousIsoWeek',
        'previousYear',
        'previousMonth',
        'previousWeek',
        'previousQuarter',
        'previousIsoWeek',
    ],
]

OPERATIONS_MAPPING = {
    'minutes': 'minute',
    'seconds': 'second',
    'dayOfYear': 'dayofyear',
}


class DateExtractStep(BaseStep):
    name = Field('dateextract', const=True)
    column: str
    date_info: List[DATE_INFO] = Field([], alias=('dateInfo'))
    new_columns: List[ColumnName] = Field([], alias='newColumns')
    operation: Optional[BASIC_DATE_PARTS]
    new_column_name: Optional[ColumnName]

    def execute(self, df: DataFrame, domain_retriever=None, execute_pipeline=None) -> DataFrame:
        date_info: List[DATE_INFO]
        if self.operation:  # for retrocompatibility
            date_info = [self.operation]
            new_columns = [self.new_column_name or f'{self.column}_{self.operation}']
        else:
            date_info = self.date_info
            new_columns = self.new_columns

        for dt_info, new_col in zip(date_info, new_columns):
            serie_dt = df[self.column].dt
            if dt_info == 'week':
                # cast in float and not in int to manage NaN properly
                result = serie_dt.strftime('%U').astype(float)
            elif dt_info == 'dayOfWeek':
                # result should be between 1 (sunday) and 7 (saturday)
                result = (serie_dt.dayofweek + 2) % 7
                result = result.replace({0: 7})
            elif dt_info == 'isoYear':
                result = serie_dt.isocalendar().year
            elif dt_info == 'isoWeek':
                result = serie_dt.isocalendar().week
            elif dt_info == 'isoDayOfWeek':
                result = serie_dt.isocalendar().day
            elif dt_info == 'firstDayOfYear':
                result = to_datetime(DataFrame({'year': serie_dt.year, 'month': 1, 'day': 1}))
            elif dt_info == 'firstDayOfMonth':
                result = to_datetime(
                    DataFrame({'year': serie_dt.year, 'month': serie_dt.month, 'day': 1})
                )
            elif dt_info == 'firstDayOfWeek':
                # dayofweek should be between 1 (sunday) and 7 (saturday)
                dayofweek = (serie_dt.dayofweek + 2) % 7
                dayofweek = dayofweek.replace({0: 7})
                # we subtract a number of days corresponding to(dayOfWeek - 1)
                result = df[self.column] - to_timedelta(dayofweek - 1, unit='d')
                # the result should be returned with 0-ed time information
                result = to_datetime(result.dt.date)
            elif dt_info == 'firstDayOfQuarter':
                result = to_datetime(
                    DataFrame(
                        {
                            'year': serie_dt.year,
                            'month': 3 * ((serie_dt.month - 1) // 3) + 1,
                            'day': 1,
                        }
                    )
                )
            elif dt_info == 'firstDayOfIsoWeek':
                dayofweek = serie_dt.isocalendar().day
                # we subtract a number of days corresponding to(dayOfWeek - 1)
                result = df[self.column] - to_timedelta(dayofweek - 1, unit='d')
                # the result should be returned with 0-ed time information
                result = to_datetime(result.dt.date)
            elif dt_info == 'previousDay':
                result = df[self.column] - to_timedelta(1, unit='d')
                # the result should be returned with 0-ed time information
                result = to_datetime(result.dt.date)
            elif dt_info == 'firstDayOfPreviousYear':
                result = to_datetime(DataFrame({'year': serie_dt.year - 1, 'month': 1, 'day': 1}))
            elif dt_info == 'firstDayOfPreviousMonth':
                prev_month = serie_dt.month - 1
                prev_month = prev_month.replace({0: 12})
                result = to_datetime(
                    DataFrame(
                        {
                            'year': serie_dt.year - (prev_month == 12),
                            'month': prev_month,
                            'day': 1,
                        }
                    )
                )
            elif dt_info == 'firstDayOfPreviousWeek':
                prev_week_date = df[self.column] - to_timedelta(7, unit='d')
                # dayofweek should be between 1 (sunday) and 7 (saturday)
                dayofweek = (prev_week_date.dt.dayofweek + 2) % 7
                dayofweek = dayofweek.replace({0: 7})
                # we subtract a number of days corresponding to(dayOfWeek - 1)
                result = prev_week_date - to_timedelta(dayofweek - 1, unit='d')
                # the result should be returned with 0-ed time information
                result = to_datetime(result.dt.date)
            elif dt_info == 'firstDayOfPreviousQuarter':
                first_month_of_quarter = 3 * ((serie_dt.month - 1) // 3) + 1
                first_month_of_prev_q = first_month_of_quarter - 3
                first_month_of_prev_q = first_month_of_prev_q.replace({-2: 10})
                result = to_datetime(
                    DataFrame(
                        {
                            'year': serie_dt.year - (first_month_of_prev_q == 10),
                            'month': first_month_of_prev_q,
                            'day': 1,
                        }
                    )
                )
            elif dt_info == 'firstDayOfPreviousIsoWeek':
                prev_week_date = df[self.column] - to_timedelta(7, unit='d')
                dayofweek = prev_week_date.dt.isocalendar().day
                # we subtract a number of days corresponding to(dayOfWeek - 1)
                result = prev_week_date - to_timedelta(dayofweek - 1, unit='d')
                # the result should be returned with 0-ed time information
                result = to_datetime(result.dt.date)
            elif dt_info == 'previousYear':
                result = serie_dt.year - 1
            elif dt_info == 'previousMonth':
                month = serie_dt.month
                result = month - 1
                result = result.replace({0: 12})
            elif dt_info == 'previousWeek':
                prev_week_date = df[self.column] - to_timedelta(7, unit='d')
                result = prev_week_date.dt.strftime('%U').astype(float)
            elif dt_info == 'previousQuarter':
                result = serie_dt.quarter - 1
                result = result.replace({0: 4})
            elif dt_info == 'previousIsoWeek':
                prev_week_date = df[self.column] - to_timedelta(7, unit='d')
                result = prev_week_date.dt.isocalendar().week
            elif dt_info == 'milliseconds':
                result = serie_dt.microsecond / 1000
            else:
                operation = OPERATIONS_MAPPING.get(dt_info, dt_info)
                result = getattr(serie_dt, operation)
            df = df.assign(**{new_col: result})

        return df


class DateExtractStepWithVariable(DateExtractStep, StepWithVariablesMixin):
    ...
