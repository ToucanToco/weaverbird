from pypika.dialects import Query

from weaverbird.backends.pypika_translator.dialects import SQLDialect
from weaverbird.backends.pypika_translator.translators.base import SQLTranslator


class AthenaTranslator(SQLTranslator):
    DIALECT = SQLDialect.ATHENA
    QUERY_CLS = Query


SQLTranslator.register(AthenaTranslator)
