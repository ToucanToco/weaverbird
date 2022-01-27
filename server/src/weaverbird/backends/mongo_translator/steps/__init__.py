from typing import Any, Callable, Dict

from weaverbird.backends.mongo_translator.steps.argmax import translate_argmax
from weaverbird.backends.mongo_translator.steps.argmin import translate_argmin
from weaverbird.backends.mongo_translator.steps.domain import translate_domain
from weaverbird.backends.mongo_translator.steps.filter import translate_filter
from weaverbird.backends.mongo_translator.steps.text import translate_text
from weaverbird.pipeline.steps import BaseStep

# I would like to have a better type for the callable, but I don't know how to do it.
# each of this function take a particular step as input
# so it is not possible to use `Dict[str, Callable[[BaseStep], list]]
mongo_step_translator: Dict[str, Callable[[Any], list]] = {
    'argmax': translate_argmax,
    'argmin': translate_argmin,
    'domain': translate_domain,
    'text': translate_text,
    'filter': translate_filter,
}
