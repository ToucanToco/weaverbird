from typing import TYPE_CHECKING

from pypika import functions
from pypika.dialects import Query

from weaverbird.backends.pypika_translator.dialects import SQLDialect
from weaverbird.backends.pypika_translator.operators import RegexOp
from weaverbird.backends.pypika_translator.translators.base import DataTypeMapping, SQLTranslator
from weaverbird.backends.pypika_translator.utils.regex import RegexNoEscapeMixin

if TYPE_CHECKING:
    from pypika.queries import Criterion, Field

    from weaverbird.pipeline.conditions import MatchCondition


class AthenaTranslator(SQLTranslator, RegexNoEscapeMixin):
    DIALECT = SQLDialect.ATHENA
    QUERY_CLS = Query
    SUPPORT_ROW_NUMBER = True
    SUPPORT_SPLIT_PART = True
    DATA_TYPE_MAPPING = DataTypeMapping(
        boolean="BOOLEAN",
        date="DATE",
        float="FLOAT",
        integer="INTEGER",
        text="VARCHAR",
        datetime="TIMESTAMP",
    )
    REGEXP_OP = RegexOp.REGEXP_LIKE
    QUOTE_CHAR = '"'

    def _matches_operation(self, condition: 'MatchCondition', column_field: 'Field') -> 'Criterion':
        return functions.Function(
            RegexOp.REGEXP_LIKE,
            column_field,
            column_field.wrap_constant(self._escape_regex(condition.value)),
        )


SQLTranslator.register(AthenaTranslator)
