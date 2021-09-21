from distutils import log
from typing import List, Sequence

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
from weaverbird.pipeline.steps import TotalsStep
from weaverbird.pipeline.steps.aggregate import Aggregation
from weaverbird.pipeline.steps.totals import TotalDimension
from weaverbird.pipeline.types import ColumnName
from weaverbird.utils.iter import combinations


def select_total_dimensions(total_dimensions: List[TotalDimension]) -> List[str]:
    selects = []
    for dimension in total_dimensions:
        selects.append(
            f"CASE WHEN GROUPING({dimension.total_column}) = 0 THEN {dimension.total_column} ELSE '{dimension.total_rows_label}' END"
        )
    return selects


def select_aggregate(aggregations: Sequence[Aggregation]) -> List[str]:
    aggregated_cols = []
    for aggregation in [
        aggregation
        for aggregation in aggregations
        if aggregation.agg_function not in ['first', 'last']
    ]:

        for col, new_col in zip(aggregation.columns, aggregation.new_columns):
            if aggregation.agg_function == 'count distinct':
                aggregated_cols.append(f'COUNT(DISTINCT {col}) AS {new_col}')
            else:
                aggregated_cols.append(f'{aggregation.agg_function.upper()}({col}) AS {new_col}')
    return aggregated_cols


def make_totals_query(step: TotalsStep, from_table: str) -> str:
    total_dimensions: List[ColumnName] = list(map(lambda x: x.total_column, step.total_dimensions))

    selects = (
        select_total_dimensions(step.total_dimensions)
        + select_aggregate(step.aggregations)
        + step.groups
    )

    group_sets = []
    for combination in combinations(total_dimensions):
        group_sets.append('(' + ','.join(combination) + ')')
    group_sets.append('()')
    group_by = step.groups + ['GROUPING SETS(' + (', '.join(group_sets)) + ')']

    query = f"""SELECT {', '.join(selects)} FROM {from_table} GROUP BY {', '.join(group_by)};"""

    return query


def translate_totals(
    step: TotalsStep,
    query: SQLQuery,
    index: int,
    sql_query_retriever: SQLQueryRetriever = None,
    sql_query_describer: SQLQueryDescriber = None,
    sql_query_executor: SQLQueryExecutor = None,
    sql_translate_pipeline: SQLPipelineTranslator = None,
    subcall_from_other_pipeline_count: int = None,
) -> SQLQuery:
    query_name = f'TOTALS_STEP_{index}'

    log.debug(
        '############################################################'
        f'query_name: {query_name}\n'
        '------------------------------------------------------------'
        f'step: {step}\n'
        f'query.transformed_query: {query.transformed_query}\n'
        f'query.metadata_manager.query_metadata: {query.metadata_manager.retrieve_query_metadata()}\n'
    )

    new_query = SQLQuery(
        query_name=query_name,
        transformed_query=f"{query.transformed_query}, {query_name} AS({make_totals_query(step, query.query_name)})",
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
