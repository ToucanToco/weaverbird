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
from weaverbird.pipeline.steps import PivotStep


def translate_pivot(
    step: PivotStep,
    query: SQLQuery,
    index: int,
    sql_query_retriever: SQLQueryRetriever = None,
    sql_query_describer: SQLQueryDescriber = None,
    sql_query_executor: SQLQueryExecutor = None,
    sql_translate_pipeline: SQLPipelineTranslator = None,
    subcall_from_other_pipeline_count: int = None,
) -> SQLQuery:
    query_name = f'PIVOT_STEP_{index}'

    log.debug(
        '############################################################'
        f'query_name: {query_name}\n'
        '------------------------------------------------------------'
        f'step: {step}\n'
        f'query.transformed_query: {query.transformed_query}\n'
        f'query.metadata_manager.query_metadata: {query.metadata_manager.retrieve_query_metadata()}\n'
    )
    aggregate_part = f'{step.agg_function}({step.value_column})'
    pivot_values = (
        sql_query_executor(
            domain=None,
            query_string=f"""{query.transformed_query} SELECT DISTINCT({step.column_to_pivot}) FROM {query.query_name}""",
        )
        .df[f'{step.column_to_pivot}']
        .values.tolist()
    )

    pivoted_values_column_type = query.metadata_manager.retrieve_query_metadata_column_by_name(
        step.value_column
    ).type
    query.metadata_manager.remove_query_metadata_columns(
        query.metadata_manager.retrieve_query_metadata_columns_as_list(columns_filter=step.index)
    )
    query.metadata_manager.add_query_metadata_columns(
        columns={f'''"'{name}'"''': pivoted_values_column_type for name in pivot_values}
    )
    [
        query.metadata_manager.update_query_metadata_column_alias(f'''"'{name}'"''', name)
        for name in pivot_values
    ]
    pivot_query = f"""SELECT {query.metadata_manager.retrieve_query_metadata_columns_as_str()} \
FROM {query.query_name} PIVOT({aggregate_part} FOR {step.column_to_pivot} IN ({', '.join([f"'{val}'" for val in pivot_values])})\
"""
    transformed_query = f"""{query.transformed_query}, {query_name} AS ({pivot_query}))"""

    new_query = SQLQuery(
        query_name=query_name,
        transformed_query=transformed_query,
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

    query.metadata_manager.update_query_metadata_column_names_with_alias()
    return new_query
