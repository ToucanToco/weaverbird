from typing import TypeVar

from pypika.dialects import SnowflakeQuery
from pypika.queries import QueryBuilder
from pypika.terms import CustomFunction, Field, LiteralValue, Term
from pypika.utils import format_quotes

from weaverbird.backends.pypika_translator.dialects import SQLDialect
from weaverbird.backends.pypika_translator.operators import FromDateOp, RegexOp, ToDateOp
from weaverbird.backends.pypika_translator.translators.base import (
    DataTypeMapping,
    SQLTranslator,
    StepContext,
)
from weaverbird.pipeline.steps.date_extract import DATE_INFO
from weaverbird.pipeline.steps.pivot import PivotStep

Self = TypeVar("Self", bound="SQLTranslator")


class SnowflakeTranslator(SQLTranslator):
    DIALECT = SQLDialect.SNOWFLAKE
    QUERY_CLS = SnowflakeQuery
    DATA_TYPE_MAPPING = DataTypeMapping(
        boolean="BOOLEAN",
        date="DATE",
        float="DOUBLE PRECISION",
        integer="INTEGER",
        text="TEXT",
        datetime="TIMESTAMP",
        timestamp="TIMESTAMP",
    )
    SUPPORT_ROW_NUMBER = True
    SUPPORT_SPLIT_PART = True
    SUPPORT_UNPIVOT = True
    SUPPORT_PIVOT = True
    FROM_DATE_OP = FromDateOp.TO_CHAR
    REGEXP_OP = RegexOp.REGEXP
    TO_DATE_OP = ToDateOp.TO_TIMESTAMP_NTZ

    @classmethod
    def _add_date(
        cls, *, date_column: Field, add_date_value: int, add_date_unit: DATE_INFO
    ) -> Term:
        add_date_func = CustomFunction('DATEADD', ['interval', 'increment', 'datecol'])
        return add_date_func(add_date_unit, add_date_value, date_column)

    @classmethod
    def _get_date_extract_func(cls, *, date_unit: DATE_INFO, target_column: Field) -> Term:
        if date_unit.lower() in [
            "seconds",
            "minutes",
            "hour",
            "day",
            "dayofweekiso",
            "dayofyear",
            "week",
            "weekiso",
            "month",
            "quarter",
            "year",
            "yearofweek",
            "yearofweekiso",
        ]:
            return LiteralValue(
                f"EXTRACT({date_unit[:-1] if date_unit in ['seconds', 'minutes'] else date_unit} "
                f"from to_timestamp({target_column.name}))"
            )
        else:
            date_func: dict[DATE_INFO, str] = {
                # Returning numbers
                # -----------------
                "milliseconds": "ROUND(EXTRACT(nanosecond FROM to_timestamp(____target____))/1000000)",
                "isoDayOfWeek": "DAYOFWEEKISO(to_timestamp(____target____))",
                "isoWeek": "WEEKISO(to_timestamp(____target____))",
                "isoYear": "YEAROFWEEKISO(to_timestamp(____target____))",
                # same problem as 'week' behaviour
                "previousWeek": "WEEK(to_timestamp(____target____) - interval '1 week')",
                "previousIsoWeek": "WEEKISO(to_timestamp(____target____) - interval '1 week')",
                "previousMonth": "MONTH(to_timestamp(____target____) - interval '1 month')",
                "previousQuarter": "QUARTER(to_timestamp(____target____) - interval '1 quarter')",
                "previousYear": "YEAR(to_timestamp(____target____) - interval '1 year')",
                "dayOfWeek": "MOD(DAYOFWEEKISO(to_timestamp(____target____)), 7) + 1",
                # Returning dates
                # ---------------
                "previousDay": "DATE_TRUNC(day, to_timestamp(____target____) - interval '1 day')",
                "firstDayOfWeek": "DATE_TRUNC(day, DATEADD(day, -(MOD(DAYOFWEEKISO(to_timestamp(____target____)), 7) + 1)+1, to_timestamp(____target____)))",
                "firstDayOfIsoWeek": "DATE_TRUNC(day, DATEADD(day, -DAYOFWEEKISO(to_timestamp(____target____))+1, to_timestamp(____target____)))",
                "firstDayOfMonth": "TO_TIMESTAMP_NTZ(DATE_TRUNC(month, to_timestamp(____target____)))",
                "firstDayOfQuarter": "TO_TIMESTAMP_NTZ(DATE_TRUNC(quarter, to_timestamp(____target____)))",
                "firstDayOfYear": "TO_TIMESTAMP_NTZ(DATE_TRUNC(year, to_timestamp(____target____)))",
                "firstDayOfPreviousWeek": "DATE_TRUNC(day, DATEADD(day, -(MOD(DAYOFWEEKISO(to_timestamp(____target____)), 7) + 1)+1, to_timestamp(____target____))) - interval '1 week'",
                "firstDayOfPreviousIsoWeek": "DATE_TRUNC(day, DATEADD(day, -DAYOFWEEKISO(to_timestamp(____target____))+1, to_timestamp(____target____))) - interval '1 week'",
                "firstDayOfPreviousMonth": "TO_TIMESTAMP_NTZ(DATE_TRUNC(month, to_timestamp(____target____))) - interval '1 month'",
                "firstDayOfPreviousQuarter": "TO_TIMESTAMP_NTZ(DATE_TRUNC(quarter, to_timestamp(____target____))) - interval '1 quarter'",
                "firstDayOfPreviousYear": "TO_TIMESTAMP_NTZ(DATE_TRUNC(year, to_timestamp(____target____))) - interval '1 year'",
            }
            return LiteralValue(
                f'{date_func[date_unit].replace("____target____", target_column.name)}'
            )

    def pivot(
        self: Self,
        *,
        builder: 'QueryBuilder',
        prev_step_name: str,
        columns: list[str],
        step: 'PivotStep',
    ) -> StepContext:
        if not (self.SUPPORT_PIVOT):
            raise NotImplementedError(f"[{self.DIALECT}] pivot is not implemented")
        pivot = self._build_pivot_col(
            step=step,
            quote_char=builder.QUOTE_CHAR,
            secondary_quote_char=builder.SECONDARY_QUOTE_CHAR,
            prev_step_name=None,
        )
        assert step.values
        values_as_cols = [
            Field(
                format_quotes(
                    format_quotes(val, builder.SECONDARY_QUOTE_CHAR),
                    builder.QUOTE_CHAR if builder.QUOTE_CHAR else '"',
                )
            ).as_(val)
            for val in step.values
        ]
        cols = step.index + values_as_cols
        query = LiteralValue(f'{self.QUERY_CLS.from_(prev_step_name).select(*cols)!s} {pivot}')
        return StepContext(query, step.index + step.values)


SQLTranslator.register(SnowflakeTranslator)
