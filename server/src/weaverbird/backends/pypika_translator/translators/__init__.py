from typing import TYPE_CHECKING, Mapping, Sequence

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


def get_translator(
    dialect: SQLDialect,
    tables_columns: Mapping[str, Sequence[str]],
    db_schema: str | None = None,
) -> "SQLTranslator":
    return ALL_TRANSLATORS[dialect](tables_columns=tables_columns, db_schema=db_schema)
