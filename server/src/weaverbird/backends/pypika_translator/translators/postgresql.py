from typing import TYPE_CHECKING

from pypika import Field, functions
from pypika.dialects import PostgreSQLQuery

from weaverbird.backends.pypika_translator.dialects import SQLDialect
from weaverbird.backends.pypika_translator.operators import FromDateOp, RegexOp, ToDateOp
from weaverbird.backends.pypika_translator.translators.base import (
    CustomQuery,
    DataTypeMapping,
    Self,
    SQLTranslator,
    StepTable,
)
from weaverbird.exceptions import MissingTableNameError

if TYPE_CHECKING:
    from pypika.queries import QueryBuilder

    from weaverbird.pipeline.steps import CustomSqlStep, DurationStep


class PostgreSQLTranslator(SQLTranslator):
    DIALECT = SQLDialect.POSTGRES
    QUERY_CLS = PostgreSQLQuery
    DATA_TYPE_MAPPING = DataTypeMapping(
        boolean="BOOLEAN",
        date="DATE",
        float="DOUBLE PRECISION",
        integer="INTEGER",
        text="TEXT",
    )
    SUPPORT_ROW_NUMBER = True
    SUPPORT_SPLIT_PART = True
    FROM_DATE_OP = FromDateOp.TO_CHAR
    REGEXP_OP = RegexOp.SIMILAR_TO
    TO_DATE_OP = ToDateOp.TO_DATE

    def duration(
        self: Self, *, step: "DurationStep", table: StepTable
    ) -> tuple["QueryBuilder", StepTable]:
        query: "QueryBuilder" = self.QUERY_CLS.from_(table.name).select(
            *table.columns,
            functions.Extract(
                step.duration_in, Field(step.end_date_column) - Field(step.start_date_column)
            ).as_(step.new_column_name),
        )
        return query, StepTable(columns=[*table.columns, step.new_column_name])

    def customsql(
        self: Self, *, step: "CustomSqlStep", table: StepTable
    ) -> tuple["QueryBuilder", StepTable]:
        """create a custom sql step based on the current table named ##PREVIOUS_STEP## in the query"""

        if table.name is None:
            raise MissingTableNameError()

        # We want all columns wraps in semicolumns
        table.columns = [f'"{c}"' for c in table.columns]
        custom_query = CustomQuery(
            name=f"custom_from_{table.name}",
            query=step.query.replace("##PREVIOUS_STEP##", table.name).replace(";", ""),
        )

        # we now have no way to know which columns remain
        # without actually executing the query
        return custom_query, StepTable(columns=["*"])


SQLTranslator.register(PostgreSQLTranslator)
