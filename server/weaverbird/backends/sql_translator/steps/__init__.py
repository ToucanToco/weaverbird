from typing import Dict

from ..types import SQLStepTranslator
from .aggregate import translate_aggregate
from .convert import translate_convert
from .filter import translate_filter
from .formula import translate_formula
from .ifthenelse import translate_ifthenelse
from .lowercase import translate_lowercase
from .rename import translate_rename
from .select import translate_select
from .sort import translate_sort
from .table import translate_table
from .text import translate_text
from .uppercase import translate_uppercase

sql_steps_translators: Dict[str, SQLStepTranslator] = {
    'domain': translate_table,  # type ignore # TODO to update
    'filter': translate_filter,
    'aggregate': translate_aggregate,
    'select': translate_select,
    'ifthenelse': translate_ifthenelse,
    'sort': translate_sort,
    'rename': translate_rename,
    'convert': translate_convert,
    'text': translate_text,
    'lowercase': translate_lowercase,
    'uppercase': translate_uppercase,
    'formula': translate_formula,
}
