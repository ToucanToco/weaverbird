from typing import List

from weaverbird.backends.mongo_translator.steps.types import MongoStep
from weaverbird.pipeline.steps import DomainStep


def translate_domain(step: DomainStep) -> List[MongoStep]:
    return [{'$match': {'domain': step.domain}}]
