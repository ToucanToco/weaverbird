from distutils import log

from weaverbird.backends.sql_translator.steps.utils.combination import (
    resolve_sql_pipeline_for_combination,
)
from weaverbird.backends.sql_translator.steps.utils.query_transformation import (
    build_join_query,
    build_selection_query,
)
from weaverbird.backends.sql_translator.types import (
    SQLPipelineTranslator,
    SQLQuery,
    SQLQueryDescriber,
    SQLQueryRetriever,
)
from weaverbird.pipeline.steps import JoinStep


def translate_join(
    step: JoinStep,
    query: SQLQuery,
    index: int,
    sql_query_retriever: SQLQueryRetriever,
    sql_query_describer: SQLQueryDescriber,
    sql_translate_pipeline: SQLPipelineTranslator = None,
) -> SQLQuery:
    query_name = f'JOIN_STEP_{index}'
    log.debug(
        "############################################################"
        f"query_name: {query_name}\n"
        "------------------------------------------------------------"
        f"step: {step}\n"
        f"query.transformed_query: {query.transformed_query}\n"
        f"query.metadata_manager.tables_metadata: {query.metadata_manager.tables_metadata}\n"
        f"query.metadata_manager.query_metadata: {query.metadata_manager.query_metadata}\n"
    )
    if step.type == 'left outer':
        how = 'LEFT'
    else:
        how = step.type.upper()

    # Retrieve the right query either directly as a domain or as a resolved sql pipeline
    print(step)
    right_query = resolve_sql_pipeline_for_combination(
        step.right_pipeline, sql_query_retriever, sql_translate_pipeline
    )
    # Update tables metadata with joined table metadata

    # 1 add right metadata
    query_to_join_metadata = sql_query_describer(domain=None, query_string=right_query)

    # 2 build the query string
    transformed_query = f"""{query.transformed_query}, {
    build_join_query(
        query_metadata=query.metadata_manager.query_metadata,
        query_to_join_metadata=query_to_join_metadata,
        left_query_name=query.query_name,
        right_query_name=f'JOIN_STEP_{index}_RIGHT',
        right_query=right_query,
        step_index=index,
        on=step.on,
        how=how
    )}"""

    # 3 Suffix columns from left part of the join in metadata
    query.metadata_manager.suffix_columns('LEFT')

    # 4 Update query metadata with all columns
    query.metadata_manager.add_columns({f'{k}_RIGHT': v for k, v in query_to_join_metadata.items()})

    # 5 update the query object
    log.debug(
        "------------------------------------------------------------"
        f"SQLquery: {transformed_query}"
        "############################################################"
    )

    return SQLQuery(
        query_name=query_name,
        transformed_query=transformed_query,
        selection_query=build_selection_query(query.metadata_manager.query_metadata, query_name),
        metadata_manager=query.metadata_manager,
    )
