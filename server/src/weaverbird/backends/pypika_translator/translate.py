from typing import Mapping, Sequence

from weaverbird.backends.pypika_translator.dialects import SQLDialect
from weaverbird.backends.pypika_translator.translators import ALL_TRANSLATORS
from weaverbird.pipeline import Pipeline


def translate_pipeline(
    *,
    sql_dialect: SQLDialect,
    pipeline: Pipeline,
    tables_columns: Mapping[str, Sequence[str]],
    db_schema: str | None = None,
) -> str:
    translator_cls = ALL_TRANSLATORS[sql_dialect]
    translator = translator_cls(
        tables_columns=tables_columns,
        db_schema=db_schema,
    )
    return translator.get_query_str(steps=pipeline.steps)
