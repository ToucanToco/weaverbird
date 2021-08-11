from typing import Dict

from ..types import SQLStepTranslator
from .aggregate import translate_aggregate
from .filter import translate_filter
from .rename import translate_rename
from .select import translate_select
from .sort import translate_sort
from .table import translate_table

sql_steps_translators: Dict[str, SQLStepTranslator] = {
    'domain': translate_table,  # type ignore # TODO to update
    'filter': translate_filter,
    'aggregate': translate_aggregate,
    'select': translate_select,
    'sort': translate_sort,
    'rename': translate_rename,
}
