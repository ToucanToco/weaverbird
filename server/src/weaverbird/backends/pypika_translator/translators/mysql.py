from typing import TYPE_CHECKING, TypeVar

from pypika import Field, Table, functions
from pypika.dialects import MySQLQuery

from weaverbird.backends.pypika_translator.dialects import SQLDialect
from weaverbird.backends.pypika_translator.operators import FromDateOp, RegexOp, ToDateOp
from weaverbird.backends.pypika_translator.translators.base import (
    DataTypeMapping,
    SQLTranslator,
    StepTable,
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
    )
    SUPPORT_ROW_NUMBER = False
    SUPPORT_SPLIT_PART = False
    FROM_DATE_OP = FromDateOp.DATE_FORMAT
    REGEXP_OP = RegexOp.REGEXP
    TO_DATE_OP = ToDateOp.STR_TO_DATE

    def split(
        self: Self, *, step: "SplitStep", table: StepTable
    ) -> tuple["QueryBuilder", StepTable]:
        col_field: Field = Table(table.name)[step.column]
        new_cols = [f"{step.column}_{i+1}" for i in range(step.number_cols_to_keep)]

        query: "QueryBuilder" = self.QUERY_CLS.from_(table.name).select(
            *table.columns,
            *(
                # https://stackoverflow.com/a/32500349
                SubstringIndex(
                    SubstringIndex(col_field, step.delimiter, i + 1), step.delimiter, -1
                ).as_(new_cols[i])
                for i in range(step.number_cols_to_keep)
            ),
        )
        return query, StepTable(columns=[*table.columns, *new_cols])


SQLTranslator.register(MySQLTranslator)


class SubstringIndex(functions.Function):  # type: ignore[misc]
    def __init__(
        self, term: str | Field, delimiter: str, count: int, alias: str | None = None
    ) -> None:
        super().__init__("SUBSTRING_INDEX", term, delimiter, count, alias=alias)
