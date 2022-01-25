from weaverbird.backends.mongo_translator.steps.argmax import translate_argmax
from weaverbird.backends.mongo_translator.steps.domain import translate_domain
from weaverbird.backends.mongo_translator.steps.text import translate_text

mongo_step_translator = {
    'argmax': translate_argmax,
    'domain': translate_domain,
    'text': translate_text,
}
