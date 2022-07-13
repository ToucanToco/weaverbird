from pypika.dialects import Query

from weaverbird.backends.pypika_translator.dialects import SQLDialect
from weaverbird.backends.pypika_translator.operators import RegexOp
from weaverbird.backends.pypika_translator.translators.base import SQLTranslator


class AthenaTranslator(SQLTranslator):
    DIALECT = SQLDialect.ATHENA
    QUERY_CLS = Query
    SUPPORT_ROW_NUMBER = True
    SUPPORT_SPLIT_PART = True
    REGEXP_OP = RegexOp.REGEXP_LIKE


SQLTranslator.register(AthenaTranslator)
