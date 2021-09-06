from distutils import log
from hashlib import md5

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
from weaverbird.pipeline.steps import RankStep

#
# WITH SELECT_STEP_0 AS (SELECT Price, Name, Category FROM products),
# AGGREGATE_STEP_1 AS (SELECT SUM(Price), Category FROM SELECT_STEP_0 GROUP BY Category) A
# inner join (SELECT * FROM SELECT_STEP_0) B ON A.Category = B.Category


def translate_rank(
    step: RankStep,
    query: SQLQuery,
    index: int,
    sql_query_retriever: SQLQueryRetriever = None,
    sql_query_describer: SQLQueryDescriber = None,
    sql_query_executor: SQLQueryExecutor = None,
    sql_translate_pipeline: SQLPipelineTranslator = None,
    subcall_from_other_pipeline_count: int = None,
) -> SQLQuery:
    query_name = f'RANK_STEP_{index}'

    log.debug(
        '############################################################'
        f'query_name: {query_name}\n'
        '------------------------------------------------------------'
        f'step: {step}\n'
        f'query.transformed_query: {query.transformed_query}\n'
        f'query.metadata_manager.query_metadata: {query.metadata_manager.retrieve_query_metadata()}\n'
    )

    rank_mode = "DENSE_RANK()" if step.method == "dense" else "RANK()"
    step.new_column_name = (
        f"{step.value_col}_RANK" if step.new_column_name is None else step.new_column_name
    )

    final_query: str = ""
    if len(step.groupby) > 0:
        # We build the group by query part
        group_by_query: str = ""
        on_query: str = ""
        sub_select_query: str = ""
        rank_query = f", ({rank_mode} OVER (ORDER BY {step.value_col} {step.order})) AS {step.new_column_name}"

        for index, gb in enumerate(step.groupby + [step.value_col]):
            # we create a subfield containing a fixed hash for the current column and the index
            sub_field = f"SUB_FIELD_{md5(gb.encode()).hexdigest()[:4].upper()}_{index}"

            # The sub select query
            sub_select_query += ("" if index == 0 else ", ") + f"{gb} AS {sub_field}"
            # The ON query regroupment
            on_query += ("" if index == 0 else " AND ") + f"({sub_field} = A.{gb})"
            # The GROUP BY query
            group_by_query += ('GROUP BY ' if index == 0 else ', ') + sub_field

        final_query = (
            f"(SELECT {sub_select_query} {rank_query} "
            f"FROM {query.query_name} {group_by_query}) B "
            f"INNER JOIN {query.query_name} A ON ({on_query})"
        )
    else:
        rank_query = f", ({rank_mode} OVER (ORDER BY {step.value_col} {step.order})) AS {step.new_column_name}"
        final_query = query.metadata_manager.retrieve_query_metadata_columns_as_str() + rank_query

    # we add the column to the metadata
    query.metadata_manager.add_query_metadata_column(step.new_column_name, 'int')

    new_query = SQLQuery(
        query_name=query_name,
        transformed_query=f"""{query.transformed_query}, {query_name} AS"""
        f""" (SELECT * FROM {final_query})""",
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
