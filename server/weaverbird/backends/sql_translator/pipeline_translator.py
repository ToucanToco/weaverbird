from typing import Tuple

from weaverbird.backends.sql_translator.types import StepTranslationReport
from weaverbird.pipeline import Pipeline, PipelineStep

from .steps import steps_translators
from .types import PipelineTranslationReport, QueryRetriever


def translate_pipeline(
    pipeline_to_translate: Pipeline, query_retriever: QueryRetriever
) -> Tuple[str, PipelineTranslationReport]:
    """For now, steps_translators are only SQL steps translators"""
    query = ''
    translate_report = []
    for index, step in enumerate(pipeline_to_translate.steps):
        try:
            query = steps_translators[step.name](
                step,
                query,
                query_retriever=query_retriever,
                translate_pipeline=translate_pipeline,
            )
            translate_report.append(StepTranslationReport(step_index=index))
        except Exception as e:
            raise PipelineTranslationFailure(step, index, e) from e
    return query, PipelineTranslationReport(steps_translation_reports=translate_report)


class PipelineTranslationFailure(Exception):
    """Raised when a error happens during the translation of the pipeline"""

    def __init__(self, step: PipelineStep, index: int, original_exception: Exception):
        self.step = step
        self.index = index
        self.original_exception = original_exception
        self.message = f'Step #{index + 1} ({step.name}) failed: {original_exception}'
        self.details = {'index': index, 'message': self.message}
