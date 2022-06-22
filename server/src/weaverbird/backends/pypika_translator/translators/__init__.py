from typing import TYPE_CHECKING

from weaverbird.backends.pypika_translator.dialects import SQLDialect

if TYPE_CHECKING:
    from .base import SQLTranslator

ALL_TRANSLATORS: dict[SQLDialect, type["SQLTranslator"]] = {}

from .athena import AthenaTranslator  # noqa
from .googlebigquery import GoogleBigQueryTranslator  # noqa
from .mysql import MySQLTranslator  # noqa
from .postgresql import PostgreSQLTranslator  # noqa
from .redshift import RedshiftTranslator  # noqa
from .snowflake import SnowflakeTranslator  # noqa
