from typing import TypeVar

from pypika import functions
from pypika.dialects import SnowflakeQuery
from pypika.enums import Dialects
from pypika.queries import QueryBuilder, format_quotes
from pypika.terms import Field, Term

from weaverbird.backends.pypika_translator.dialects import SQLDialect
from weaverbird.backends.pypika_translator.operators import FromDateOp, RegexOp, ToDateOp
from weaverbird.backends.pypika_translator.translators.base import (
    DataTypeMapping,
    DateAddWithoutUnderscore,
    SQLTranslator,
    StepContext,
)
from weaverbird.pipeline.steps.unpivot import UnpivotStep

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
    FROM_DATE_OP = FromDateOp.TO_CHAR
    REGEXP_OP = RegexOp.REGEXP
    TO_DATE_OP = ToDateOp.TO_TIMESTAMP_NTZ

    @classmethod
    def _add_date(
        cls, *, target_column: Field, duration: int, unit: str, dialect: Dialects | None = None
    ) -> Term:
        return DateAddWithoutUnderscore(
            date_part=unit.removesuffix("s"), interval=duration, term=target_column
        )

    @classmethod
    def _build_unpivot_col(
        cls, *, step: "UnpivotStep", quote_char: str | None, secondary_quote_char: str
    ) -> str:
        value_col = format_quotes(step.value_column_name, quote_char)
        unpivot_col = format_quotes(step.unpivot_column_name, quote_char)
        in_cols = ", ".join(col for col in step.unpivot)

        return f"UNPIVOT({value_col} FOR {unpivot_col} IN ({in_cols}))"

    def unpivot(
        self: Self,
        *,
        builder: "QueryBuilder",
        prev_step_name: str,
        columns: list[str],
        step: "UnpivotStep",
    ) -> StepContext:
        # FIXME: On Snowflake, We should find a better way to tell a user he/she can only do
        # an unpivot on columns that have the same type instead of casting it like that
        columns_to_loop = [
            f"{functions.Cast(col, self.DATA_TYPE_MAPPING.float).get_sql()} AS {col}"
            for col in step.unpivot
        ] + [col for col in step.keep + [step.unpivot_column_name] + [step.value_column_name]]
        sub_query = self.QUERY_CLS.from_(prev_step_name).select(columns_to_loop)

        unpivot = self._build_unpivot_col(
            step=step,
            quote_char=builder.QUOTE_CHAR,
            secondary_quote_char=builder.SECONDARY_QUOTE_CHAR,
        )
        cols = step.keep + [step.unpivot_column_name] + [step.value_column_name]
        query = functions.LiteralValue(
            f"{self.QUERY_CLS.from_(sub_query).select(*cols)!s} {unpivot}"
        )
        return StepContext(query, cols)


SQLTranslator.register(SnowflakeTranslator)
