from weaverbird.backends.mongo_translator.steps.types import MongoStep
from weaverbird.pipeline.steps import DomainStep


def translate_domain(step: DomainStep) -> list[MongoStep]:
    return [{"$match": {"domain": step.domain}}]
