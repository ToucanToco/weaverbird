from typing import TYPE_CHECKING

from pypika import Field, functions
from pypika.dialects import PostgreSQLQuery
from pypika.terms import LiteralValue

from weaverbird.backends.pypika_translator.dialects import SQLDialect
from weaverbird.backends.pypika_translator.operators import FromDateOp, RegexOp, ToDateOp
from weaverbird.backends.pypika_translator.translators.base import (
    DATE_UNIT,
    DataTypeMapping,
    Self,
    SQLTranslator,
    StepContext,
)

if TYPE_CHECKING:
    from pypika.queries import QueryBuilder

    from weaverbird.pipeline.steps import DurationStep, EvolutionStep


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
    )
    SUPPORT_ROW_NUMBER = True
    SUPPORT_SPLIT_PART = True
    FROM_DATE_OP = FromDateOp.TO_CHAR
    REGEXP_OP = RegexOp.SIMILAR_TO
    TO_DATE_OP = ToDateOp.TO_DATE
    QUOTE_CHAR = '"'

    @classmethod
    def _add_date(cls, *, date_column: str | Field, add_date_value: int, add_date_unit: DATE_UNIT):
        return LiteralValue(f"{date_column} + INTERVAL '{add_date_value} {add_date_unit}'")

    def evolution(
        self: Self,
        *,
        builder: 'QueryBuilder',
        prev_step_name: str,
        columns: list[str],
        step: "EvolutionStep",
    ) -> StepContext:

        self.DATEADD_FUNC = LiteralValue(
            f"{step.date_col} + INTERVAL '1 {self.EVOLUTION_DATE_UNIT[step.evolution_type]}'"
        )
        return super().evolution(  # type: ignore
            builder=builder, prev_step_name=prev_step_name, columns=columns, step=step
        )

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


SQLTranslator.register(PostgreSQLTranslator)
