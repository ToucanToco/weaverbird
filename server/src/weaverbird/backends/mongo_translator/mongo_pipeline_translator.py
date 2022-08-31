from typing import Any

from weaverbird.backends.mongo_translator.steps import mongo_step_translator
from weaverbird.pipeline import Pipeline, PipelineStep
from weaverbird.pipeline.pipeline import PipelineWithVariables


def translate_pipeline(
    pipeline_to_translate: Pipeline | PipelineWithVariables,
) -> list[dict[str, Any]]:
    mongo_pipeline = []
    for index, step in enumerate(pipeline_to_translate.steps):
        try:
            mongo_pipeline.extend(mongo_step_translator[step.name](step))
        except Exception as e:
            raise PipelineTranslationFailure(step, index, e) from e
    return mongo_pipeline


class PipelineTranslationFailure(Exception):
    """Raised when a error happens during the translation of the pipeline"""

    def __init__(self, step: PipelineStep, index: int, original_exception: Exception):
        self.step = step
        self.index = index
        self.original_exception = original_exception
        self.message = f"Step #{index + 1} ({step.name}) failed: {original_exception}"
        self.details = {"index": index, "message": self.message}
