from typing import Dict

from .domain import translate_domain
from .filter import translate_filter
from ..types import StepTranslator

steps_translators: Dict[str, StepTranslator] = {
    'domain': translate_domain,  # type ignore
    'filter': translate_filter,
}
