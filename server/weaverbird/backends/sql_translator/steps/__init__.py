from typing import Dict

from ..types import SQLStepTranslator
from .domain import translate_domain
from .filter import translate_filter

sql_steps_translators: Dict[str, SQLStepTranslator] = {
    'domain': translate_domain,  # type ignore
    'filter': translate_filter,
}
