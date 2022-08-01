from datetime import datetime
from typing import TYPE_CHECKING, TypeVar

from pypika import Field, Table, functions
from pypika.dialects import MySQLQuery
from pypika.terms import LiteralValue, Term

from weaverbird.backends.pypika_translator.dialects import SQLDialect
from weaverbird.backends.pypika_translator.operators import FromDateOp, RegexOp, ToDateOp
from weaverbird.backends.pypika_translator.translators.base import (
    DATE_INFO,
    DataTypeMapping,
    SQLTranslator,
    StepContext,
)

Self = TypeVar("Self", bound="MySQLTranslator")


if TYPE_CHECKING:
    from pypika.queries import QueryBuilder

    from weaverbird.pipeline.steps import SplitStep


class MySQLTranslator(SQLTranslator):
    DIALECT = SQLDialect.MYSQL
    QUERY_CLS = MySQLQuery
    DATA_TYPE_MAPPING = DataTypeMapping(
        boolean="SIGNED",
        date="DATE",
        float="DECIMAL",
        integer="UNSIGNED",
        text="CHAR",
        datetime="TIMESTAMP",
        timestamp="TIMESTAMP",
    )
    # Requires MySQL>=8
    SUPPORT_ROW_NUMBER = True
    SUPPORT_SPLIT_PART = False
    FROM_DATE_OP = FromDateOp.DATE_FORMAT
    REGEXP_OP = RegexOp.REGEXP
    TO_DATE_OP = ToDateOp.STR_TO_DATE
    QUOTE_CHAR = '`'

    @classmethod
    def _add_date(
        cls, *, date_column: Field, add_date_value: int, add_date_unit: DATE_INFO
    ) -> Term:
        return LiteralValue(
            f"DATE_ADD({date_column.name}, INTERVAL {add_date_value} {add_date_unit})"
        )

    def split(
        self: Self,
        *,
        builder: 'QueryBuilder',
        prev_step_name: str,
        columns: list[str],
        step: "SplitStep",
    ) -> StepContext:
        col_field: Field = Table(prev_step_name)[step.column]
        new_cols = [f"{step.column}_{i+1}" for i in range(step.number_cols_to_keep)]

        query: "QueryBuilder" = self.QUERY_CLS.from_(prev_step_name).select(
            *columns,
            *(
                # https://stackoverflow.com/a/32500349
                SubstringIndex(
                    SubstringIndex(col_field, step.delimiter, i + 1), step.delimiter, -1
                ).as_(new_cols[i])
                for i in range(step.number_cols_to_keep)
            ),
        )
        return StepContext(query, columns + new_cols)

    @staticmethod
    def _cast_to_timestamp(value: str | datetime | Field | Term) -> functions.Function:
        return functions.Timestamp(value)


SQLTranslator.register(MySQLTranslator)


class SubstringIndex(functions.Function):  # type: ignore[misc]
    def __init__(
        self, term: str | Field, delimiter: str, count: int, alias: str | None = None
    ) -> None:
        super().__init__("SUBSTRING_INDEX", term, delimiter, count, alias=alias)
