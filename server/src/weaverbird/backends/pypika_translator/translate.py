from typing import Callable

from pypika.queries import AliasedQuery

from weaverbird.backends.pypika_translator.translators.base import SQLTranslator
from weaverbird.pipeline import Pipeline


class TableResolutionError(Exception):
    ...


# Returns a translator instance OR a raw SQL query OR None if no table could be found
TableResolver = Callable[[str], SQLTranslator | AliasedQuery | None]


def translate_pipeline(
    *,
    pipeline: Pipeline,
    table_resolver: TableResolver,
    table: str,
) -> str:
    if not (translator := table_resolver(table)):
        raise TableResolutionError(f"Could not resolve table '{table}'")
    return (
        translator.get_sql()
        if isinstance(translator, AliasedQuery)
        else translator.get_query_str(steps=pipeline.steps)
    )
