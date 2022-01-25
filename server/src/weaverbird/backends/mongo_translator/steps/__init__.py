from weaverbird.backends.mongo_translator.steps.argmax import translate_argmax
from weaverbird.backends.mongo_translator.steps.argmin import translate_argmin
from weaverbird.backends.mongo_translator.steps.domain import translate_domain
from weaverbird.backends.mongo_translator.steps.filter import translate_filter
from weaverbird.backends.mongo_translator.steps.text import translate_text

mongo_step_translator = {
    'argmax': translate_argmax,
    'argmin': translate_argmin,
    'domain': translate_domain,
    'text': translate_text,
    'filter': translate_filter,
}
