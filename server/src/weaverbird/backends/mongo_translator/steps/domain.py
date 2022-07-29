from typing import List

from weaverbird.backends.mongo_translator.registry import register
from weaverbird.backends.mongo_translator.steps.types import MongoStep
from weaverbird.pipeline.steps import DomainStep


@register
def translate_domain(step: DomainStep) -> List[MongoStep]:
    return [{'$match': {'domain': step.domain}}]
