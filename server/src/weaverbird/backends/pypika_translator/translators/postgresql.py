from typing import TYPE_CHECKING

from pypika import Field, functions
from pypika.dialects import PostgreSQLQuery

from weaverbird.backends.pandas_executor.steps.utils.dates import evaluate_relative_date
from weaverbird.backends.pypika_translator.dialects import SQLDialect
from weaverbird.backends.pypika_translator.operators import FromDateOp, RegexOp, ToDateOp
from weaverbird.backends.pypika_translator.translators.base import (
    DataTypeMapping,
    Self,
    SQLTranslator,
    StepContext,
)
from weaverbird.pipeline.conditions import ConditionComboAnd, ConditionComboOr, DateBoundCondition
from weaverbird.pipeline.dates import RelativeDate
from weaverbird.pipeline.steps.filter import FilterStep

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
    )
    SUPPORT_ROW_NUMBER = True
    SUPPORT_SPLIT_PART = True
    FROM_DATE_OP = FromDateOp.TO_CHAR
    REGEXP_OP = RegexOp.SIMILAR_TO
    TO_DATE_OP = ToDateOp.TO_DATE

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

    def filter(
        self,
        *,
        builder: 'QueryBuilder',
        prev_step_name: str,
        columns: list[str],
        step: "FilterStep",
    ) -> StepContext:

        # To handle relative date formats
        cond = step.condition
        if isinstance(cond, (ConditionComboAnd, ConditionComboOr)):

            operator = 'and_' if isinstance(cond, ConditionComboAnd) else 'or_'

            for sub_cond in getattr(cond, operator) or []:
                if isinstance(sub_cond, DateBoundCondition) and isinstance(
                    getattr(sub_cond, 'value'), RelativeDate
                ):
                    setattr(sub_cond, 'value', evaluate_relative_date(getattr(sub_cond, 'value')))

        query: "QueryBuilder" = (
            self.QUERY_CLS.from_(prev_step_name)
            .select(*columns)
            .where(self._get_filter_criterion(step.condition, prev_step_name))
        )

        return StepContext(query, columns)


SQLTranslator.register(PostgreSQLTranslator)
