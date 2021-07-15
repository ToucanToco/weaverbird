from typing import Dict

from ..types import StepTranslator
from .domain import translate_domain
from .filter import translate_filter

steps_translators: Dict[str, StepTranslator] = {
    'domain': translate_domain,  # type ignore
    'filter': translate_filter,
}
