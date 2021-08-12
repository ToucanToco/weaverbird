from distutils import log
from typing import Dict, List

from weaverbird.backends.sql_translator.steps.utils.query_transformation import (
    build_selection_query,
)
from weaverbird.backends.sql_translator.types import (
    SQLPipelineTranslator,
    SQLQuery,
    SQLQueryDescriber,
    SQLQueryRetriever,
)
from weaverbird.pipeline.steps import ConvertStep


def translate_convert(
    step: ConvertStep,
    query: SQLQuery,
    index: int,
    sql_query_retriever: SQLQueryRetriever = None,
    sql_query_describer: SQLQueryDescriber = None,
    sql_translate_pipeline: SQLPipelineTranslator = None,
) -> SQLQuery:
    query_name = f'CONVERT_STEP_{index}'

    log.debug(
        "############################################################"
        f"query_name: {query_name}\n"
        "------------------------------------------------------------"
        f"step.columns: {step.columns}\n"
        f"step.data_type: {step.data_type}\n"
        f"query.transformed_query: {query.transformed_query}\n"
        f"query.metadata_manager.tables_metadata: {query.metadata_manager.tables_metadata}\n"
    )

    new_query = SQLQuery(
        query_name=query_name,
        transformed_query=f"""{query.transformed_query}, {query_name} AS"""
        f""" (SELECT CAST(raichu AS VARCHAR) as raichu FROM {query.query_name})""",
        selection_query=build_selection_query(query.metadata_manager.tables_metadata, query_name),
        metadata_manager=query.metadata_manager,
    )

    log.debug(
        "------------------------------------------------------------"
        f"SQLquery: {new_query.transformed_query}"
        "############################################################"
    )

    return new_query

#
# step = ConvertStep(name='convert', columns=['value'], data_type='float')
# class ConvertStep(BaseStep):
#     name = Field('convert', const=True)
#     columns: List[ColumnName]
#     data_type: Literal['integer', 'float', 'text', 'date', 'boolean']
