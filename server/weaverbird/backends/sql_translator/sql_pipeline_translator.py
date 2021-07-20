from typing import Tuple

from weaverbird.backends.sql_translator.types import SQLStepTranslationReport
from weaverbird.pipeline import Pipeline, PipelineStep

from .steps import sql_steps_translators
from .types import SQLPipelineTranslationReport, SQLQueryRetriever


def translate_pipeline(
    pipeline_to_translate: Pipeline, sql_query_retriever: SQLQueryRetriever
) -> Tuple[str, SQLPipelineTranslationReport]:
    """
    The main function of the module. Translates a pipeline and returns the result as a transformed query.
    """
    query = ''
    translate_report = []
    for index, step in enumerate(pipeline_to_translate.steps):
        try:
            query = sql_steps_translators[step.name](
                step,
                query,
                sql_query_retriever=sql_query_retriever,
                sql_translate_pipeline=translate_pipeline,
            )
            translate_report.append(SQLStepTranslationReport(step_index=index))
        except Exception as e:
            raise SQLPipelineTranslationFailure(step, index, e) from e
    return query, SQLPipelineTranslationReport(sql_steps_translation_reports=translate_report)


class SQLPipelineTranslationFailure(Exception):
    """Raised when a error happens during the translation of the pipeline"""

    def __init__(self, step: PipelineStep, index: int, original_exception: Exception):
        self.step = step
        self.index = index
        self.original_exception = original_exception
        self.message = f'Step #{index + 1} ({step.name}) failed: {original_exception}'
        self.details = {'index': index, 'message': self.message}
