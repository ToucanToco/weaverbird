from typing import Any, Callable, Dict, List, Union

from weaverbird.backends.mongo_translator.steps.aggregate import translate_aggregate
from weaverbird.backends.mongo_translator.steps.append import translate_append
from weaverbird.backends.mongo_translator.steps.argmax import translate_argmax
from weaverbird.backends.mongo_translator.steps.argmin import translate_argmin
from weaverbird.backends.mongo_translator.steps.concatenate import translate_concatenate
from weaverbird.backends.mongo_translator.steps.domain import translate_domain
from weaverbird.backends.mongo_translator.steps.filter import translate_filter
from weaverbird.backends.mongo_translator.steps.formula import translate_formula
from weaverbird.backends.mongo_translator.steps.ifthenelse import translate_ifthenelse
from weaverbird.backends.mongo_translator.steps.join import translate_join
from weaverbird.backends.mongo_translator.steps.rename import translate_rename
from weaverbird.backends.mongo_translator.steps.sort import translate_sort
from weaverbird.backends.mongo_translator.steps.text import translate_text
from weaverbird.backends.mongo_translator.steps.todate import translate_todate

# I would like to have a better type for the callable, but I don't know how to do it.
# each of this function take a particular step as input
# so it is not possible to use `Dict[str, Callable[[BaseStep], list]]
mongo_step_translator: Dict[str, Callable[[Any], list]] = {
    'aggregate': translate_aggregate,
    'append': translate_append,
    'argmax': translate_argmax,
    'argmin': translate_argmin,
    'concatenate': translate_concatenate,
    'domain': translate_domain,
    'filter': translate_filter,
    'formula': translate_formula,
    'ifthenelse': translate_ifthenelse,  # type: ignore
    'join': translate_join,
    'rename': translate_rename,
    'sort': translate_sort,
    'text': translate_text,
    'todate': translate_todate,
}
