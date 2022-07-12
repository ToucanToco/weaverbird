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


SQLTranslator.register(AthenaTranslator)
