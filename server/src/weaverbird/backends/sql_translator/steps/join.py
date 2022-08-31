from distutils import log

from weaverbird.backends.sql_translator.steps.utils.combination import (
    resolve_sql_pipeline_for_combination,
)
from weaverbird.backends.sql_translator.steps.utils.query_transformation import (
    build_selection_query,
)
from weaverbird.backends.sql_translator.types import (
    SQLDialect,
    SQLPipelineTranslator,
    SQLQuery,
    SQLQueryDescriber,
    SQLQueryExecutor,
    SQLQueryRetriever,
)
from weaverbird.pipeline.steps import JoinStep


def translate_join(
    step: JoinStep,
    query: SQLQuery,
    index: int,
    sql_query_retriever: SQLQueryRetriever = None,
    sql_query_describer: SQLQueryDescriber = None,
    sql_query_executor: SQLQueryExecutor = None,
    sql_translate_pipeline: SQLPipelineTranslator = None,
    subcall_from_other_pipeline_count: int = None,
    sql_dialect: SQLDialect = None,
) -> SQLQuery:
    query_name = f"JOIN_STEP_{index}"
    log.debug(
        "############################################################"
        f"query_name: {query_name}\n"
        "------------------------------------------------------------"
        f"step: {step}\n"
        f"query.transformed_query: {query.transformed_query}\n"
        f"query.metadata_manager.query_metadata: {query.metadata_manager.retrieve_query_metadata()}\n"
    )

    if step.type == "left outer":
        how = "LEFT"
    else:
        how = step.type.upper()

    # Retrieve the right query either directly as a domain or as a resolved sql pipeline
    right_query = resolve_sql_pipeline_for_combination(
        step.right_pipeline,
        sql_query_retriever,
        sql_translate_pipeline,
        sql_query_describer,
        sql_query_executor,
    )
    right_query_name = f"JOIN_STEP_{index}_RIGHT"
    # Update tables metadata with joined table metadata

    # 1 retrieve right metadata
    query_to_join_metadata = sql_query_describer(domain=None, query_string=right_query)

    # 2 Add them to the MetadataManager
    query.metadata_manager.create_table(right_query_name)
    query.metadata_manager.add_table_columns_from_dict(right_query_name, query_to_join_metadata)

    # 3 Update transformed query string with right query selection
    transformed_query = f"{query.transformed_query}, {right_query_name} AS ({right_query})"

    # 4 Join left & right metadata in internal metadata
    query.metadata_manager.join_query_metadata(right_query_name, left_query_name=query.query_name)

    # 5 build the final query string
    join_part = f"{'AND'.join([f'{query.query_name}.{keys[0]} = {right_query_name}.{keys[1]}' for keys in step.on])}"

    transformed_query = f"""{transformed_query}, {query_name} AS (SELECT {query.metadata_manager.retrieve_query_metadata_columns_as_str()} FROM {query.query_name} {how} JOIN {right_query_name} ON {join_part})"""

    log.debug(
        "------------------------------------------------------------"
        f"SQLquery: {transformed_query}"
        "############################################################"
    )

    new_query = SQLQuery(
        query_name=query_name,
        transformed_query=transformed_query,
        selection_query=build_selection_query(
            query.metadata_manager.retrieve_query_metadata_columns(), query_name
        ),
        metadata_manager=query.metadata_manager,
    )

    query.metadata_manager.update_query_metadata_column_names_with_alias()
    return new_query
