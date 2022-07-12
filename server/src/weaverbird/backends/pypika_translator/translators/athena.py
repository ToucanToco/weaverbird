from datetime import datetime

from pypika import functions
from pypika.dialects import Query
from pypika.queries import QueryBuilder

from weaverbird.backends.pandas_executor.steps.utils.dates import evaluate_relative_date
from weaverbird.backends.pypika_translator.dialects import SQLDialect
from weaverbird.backends.pypika_translator.translators.base import SQLTranslator, StepContext
from weaverbird.pipeline.conditions import ConditionComboAnd, ConditionComboOr, DateBoundCondition
from weaverbird.pipeline.dates import RelativeDate
from weaverbird.pipeline.steps.filter import FilterStep


class AthenaTranslator(SQLTranslator):
    DIALECT = SQLDialect.ATHENA
    QUERY_CLS = Query
    SUPPORT_ROW_NUMBER = True
    SUPPORT_SPLIT_PART = True

    # Since Athena doesn't handle date comparaison as string and raise :
    # awswrangler.exceptions.QueryFailed: SYNTAX_ERROR: line 31:27: '<=' cannot be applied to date, varchar(25).
    # You may need to manually clean the data at location 's3://to....' before retrying.
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

            conditions = cond.and_ if isinstance(cond, ConditionComboAnd) else cond.or_
            for i, sub_cond in enumerate(conditions):
                if isinstance(sub_cond, DateBoundCondition):
                    value = getattr(sub_cond, 'value')
                    if isinstance(value, RelativeDate):
                        value = evaluate_relative_date(value).strftime("%Y-%m-%d %H:%M:%S")
                    elif isinstance(value, datetime):
                        value = value.strftime("%Y-%m-%d %H:%M:%S")

                    conditions[i].value = functions.Cast(value, 'TIMESTAMP')  # type: ignore

        query: "QueryBuilder" = (
            self.QUERY_CLS.from_(prev_step_name)
            .select(*columns)
            .where(self._get_filter_criterion(step.condition, prev_step_name))
        )

        return StepContext(query, columns)


SQLTranslator.register(AthenaTranslator)
