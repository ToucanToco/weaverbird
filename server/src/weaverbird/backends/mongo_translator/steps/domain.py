from weaverbird.pipeline.steps import DomainStep


def translate_domain(step: DomainStep) -> list:
    return [{'$match': {'domain': step.domain}}]
