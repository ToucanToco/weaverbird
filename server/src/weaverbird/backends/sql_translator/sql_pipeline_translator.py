from weaverbird.backends.sql_translator.types import SQLQuery, SQLStepTranslationReport
from weaverbird.pipeline import Pipeline, PipelineStep

from .steps import sql_steps_translators
from .types import (
    SQLDialect,
    SQLPipelineTranslationReport,
    SQLQueryDescriber,
    SQLQueryExecutor,
    SQLQueryRetriever,
)


def translate_pipeline(
    pipeline_to_translate: Pipeline,
    sql_query_retriever: SQLQueryRetriever,  # TODO : rename it to sql_table_retriever when ready
    sql_query_describer: SQLQueryDescriber,
    sql_query_executor: SQLQueryExecutor,
    subcall_from_other_pipeline_count: int = None,
    sql_dialect: SQLDialect = None,
) -> tuple[SQLQuery, SQLPipelineTranslationReport]:
    """
    The main function of the module. Translates a pipeline and returns the result as a transformed query.
    For example, a Select step chained with a filter step will output a query string like this:

    with select_step_1 as (select * from "DB"."SCHEMA"."TABLE" limit 100),
    filter_step_2 as (select * from select_step_1 where ID > 2)
    select * from filter_step_2

    """
    query = SQLQuery()
    translate_report = []
    for index, step in enumerate(pipeline_to_translate.steps):
        try:
            query = sql_steps_translators[step.name](
                step,
                query,
                index,
                sql_query_retriever=sql_query_retriever,
                sql_query_describer=sql_query_describer,
                sql_query_executor=sql_query_executor,
                sql_translate_pipeline=translate_pipeline,
                subcall_from_other_pipeline_count=subcall_from_other_pipeline_count,
                sql_dialect=sql_dialect,
            )
            translate_report.append(SQLStepTranslationReport(step_index=index))
        except Exception as e:
            raise SQLPipelineTranslationFailure(step, index, e) from e

    query_string = f"{query.transformed_query} {query.selection_query}"
    return query_string, SQLPipelineTranslationReport(
        sql_steps_translation_reports=translate_report
    )


class SQLPipelineTranslationFailure(Exception):
    """Raised when a error happens during the translation of the pipeline"""

    def __init__(self, step: PipelineStep, index: int, original_exception: Exception):
        self.step = step
        self.index = index
        self.original_exception = original_exception
        self.message = f"Step #{index + 1} ({step.name}) failed: {original_exception}"
        self.details = {"index": index, "message": self.message}
