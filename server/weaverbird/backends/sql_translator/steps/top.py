from distutils import log

from weaverbird.backends.sql_translator.steps.utils.query_transformation import (
    build_selection_query,
)
from weaverbird.backends.sql_translator.types import (
    SQLPipelineTranslator,
    SQLQuery,
    SQLQueryDescriber,
    SQLQueryExecutor,
    SQLQueryRetriever,
)
from weaverbird.pipeline.steps import TopStep


def translate_top(
    step: TopStep,
    query: SQLQuery,
    index: int,
    sql_query_retriever: SQLQueryRetriever = None,
    sql_query_describer: SQLQueryDescriber = None,
    sql_query_executor: SQLQueryExecutor = None,
    sql_translate_pipeline: SQLPipelineTranslator = None,
    subcall_from_other_pipeline_count: int = None,
) -> SQLQuery:
    query_name = f'TOP_STEP_{index}'

    log.debug(
        '############################################################'
        f'query_name: {query_name}\n'
        '------------------------------------------------------------'
        f'step.name: {step.name}\n'
        f'step.groups: {step.groups}\n'
        f'step.rank_on: {step.rank_on}\n'
        f'step.sort: {step.sort}\n'
        f'step.limit: {step.limit}\n'
        f'query.transformed_query: {query.transformed_query}\n'
        f'query.metadata_manager.query_metadata: {query.metadata_manager.retrieve_query_metadata()}\n'
    )

    # We build the group by query part
    group_by_query: str = ''
    if len(step.groups) > 0:
        for index, gb in enumerate(step.groups + [step.rank_on]):
            group_by_query += ('GROUP BY ' if index == 0 else ', ') + gb

    # We remove other columns not in the group-by
    query.metadata_manager.remove_query_metadata_columns(
        [
            col
            for col in query.metadata_manager.retrieve_query_metadata_columns_as_list()
            if col not in step.groups + [step.rank_on]
        ]
        if len(step.groups) > 0
        else []
    )

    # fields to complete the query
    completed_fields = query.metadata_manager.retrieve_query_metadata_columns_as_str()

    new_query = SQLQuery(
        query_name=query_name,
        transformed_query=f"""{query.transformed_query}, {query_name} AS"""
        f""" (SELECT {completed_fields}"""
        f""" FROM {query.query_name} {group_by_query} ORDER BY {step.rank_on} {step.sort} LIMIT {step.limit})""",
        selection_query=build_selection_query(
            query.metadata_manager.retrieve_query_metadata_columns(), query_name
        ),
        metadata_manager=query.metadata_manager,
    )

    log.debug(
        '------------------------------------------------------------'
        f'SQLquery: {new_query.transformed_query}'
        '############################################################'
    )

    return new_query
