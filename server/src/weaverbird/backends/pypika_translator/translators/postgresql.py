from typing import TYPE_CHECKING

from pypika import Field, functions
from pypika.dialects import PostgreSQLQuery
from pypika.terms import LiteralValue, Term

from weaverbird.backends.pypika_translator.dialects import SQLDialect
from weaverbird.backends.pypika_translator.operators import FromDateOp, RegexOp, ToDateOp
from weaverbird.backends.pypika_translator.translators.base import (
    DATE_INFO,
    DataTypeMapping,
    Self,
    SQLTranslator,
    StepContext,
)

if TYPE_CHECKING:
    from pypika.queries import QueryBuilder

    from weaverbird.pipeline.steps import DurationStep


class PostgreSQLTranslator(SQLTranslator):
    DIALECT = SQLDialect.POSTGRES
    QUERY_CLS = PostgreSQLQuery
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
    FROM_DATE_OP = FromDateOp.TO_CHAR
    REGEXP_OP = RegexOp.SIMILAR_TO
    TO_DATE_OP = ToDateOp.TO_TIMESTAMP
    QUOTE_CHAR = '"'

    @classmethod
    def _add_date(
        cls, *, date_column: Field, add_date_value: int, add_date_unit: DATE_INFO
    ) -> Term:
        return LiteralValue(f"{date_column.name} + INTERVAL '{add_date_value} {add_date_unit}'")

    def duration(
        self: Self,
        *,
        builder: 'QueryBuilder',
        prev_step_name: str,
        columns: list[str],
        step: "DurationStep",
    ) -> StepContext:
        query: "QueryBuilder" = self.QUERY_CLS.from_(prev_step_name).select(
            *columns,
            functions.Extract(
                step.duration_in, Field(step.end_date_column) - Field(step.start_date_column)
            ).as_(step.new_column_name),
        )
        return StepContext(query, columns + [step.new_column_name])

    @classmethod
    def _get_date_extract_func(cls, *, date_unit: DATE_INFO, target_column: Field) -> Term:
        if date_unit.lower() in [
            "seconds",
            "minutes",
            "hour",
            "day",
            "dayofweekiso",
            "week",
            "weekiso",
            "month",
            "milliseconds",
            "quarter",
            "year",
            "yearofweek",
            "yearofweekiso",
        ]:
            return LiteralValue(
                f"EXTRACT({date_unit[:-1] if date_unit in ['seconds', 'minutes'] else date_unit} "
                f"from {target_column.name})"
            )
        else:
            date_func: dict[DATE_INFO, str] = {
                # Returning numbers
                # -----------------
                "dayOfYear": "EXTRACT('doy' from ____target____)",
                "isoDayOfWeek": "EXTRACT('isodow' FROM ____target____)",
                "isoWeek": "EXTRACT('week' FROM ____target____)",
                "isoYear": "EXTRACT('isoyear' FROM ____target____)",
                # same problem as 'week' behaviour
                "previousWeek": "EXTRACT('week' FROM ____target____ - interval '1 week')",
                "previousIsoWeek": "EXTRACT('week' FROM ____target____ - interval '1 week')",
                "previousMonth": "EXTRACT('month' FROM ____target____ - interval '1 month')",
                "previousQuarter": "EXTRACT('quarter' FROM ____target____ - interval '3 month')",
                "previousYear": "EXTRACT('year' FROM ____target____ - interval '1 year')",
                "dayOfWeek": "MOD(EXTRACT('isodow' FROM ____target____), 7) + 1",
                # Returning dates
                # ---------------
                "previousDay": "DATE_TRUNC('day', ____target____ - interval '1 day')",
                "firstDayOfWeek": "DATE_TRUNC('day', ____target____ -(CAST(MOD(EXTRACT('isodow' from ____target____), 7) || ' days' as Interval) + interval '1 day')+ interval '1 day')",
                "firstDayOfIsoWeek": "DATE_TRUNC('week', ____target____)",
                "firstDayOfMonth": "DATE_TRUNC('month', ____target____)",
                "firstDayOfQuarter": "DATE_TRUNC('quarter', ____target____)",
                "firstDayOfYear": "DATE_TRUNC('year', ____target____)",
                "firstDayOfPreviousWeek": "DATE_TRUNC('day', ____target____ -(CAST(MOD(EXTRACT('isodow' from ____target____), 7) || ' days' as Interval) + interval '1 day')+ interval '1 day') - interval '1 week'",
                "firstDayOfPreviousIsoWeek": "DATE_TRUNC('week', ____target____ - interval '1 week')",
                "firstDayOfPreviousMonth": "DATE_TRUNC('month', ____target____) - interval '1 month'",
                "firstDayOfPreviousQuarter": "DATE_TRUNC('quarter', ____target____) - interval '3 months'",
                "firstDayOfPreviousYear": "DATE_TRUNC('year', ____target____) - interval '1 year'",
            }
            return LiteralValue(
                f'{date_func[date_unit].replace("____target____", target_column.name)}'
            )


SQLTranslator.register(PostgreSQLTranslator)
