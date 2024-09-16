from typing import Any

from weaverbird.backends.mongo_translator.steps import mongo_step_translator
from weaverbird.exceptions import PipelineFailure
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


class PipelineTranslationFailure(PipelineFailure):
    """Raised when an error happens during the translation of the pipeline"""

    def __init__(self, step: PipelineStep, index: int, original_exception: Exception):
        super().__init__(
            step_name=step.name, step_config=step.model_dump(), index=index, original_exception=original_exception
        )
        self.step = step
        self.index = index
