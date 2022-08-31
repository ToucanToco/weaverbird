from collections.abc import Sequence
from distutils import log

from weaverbird.backends.sql_translator.metadata import ColumnMetadata, SqlQueryMetadataManager
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
from weaverbird.pipeline.steps import TotalsStep
from weaverbird.pipeline.steps.aggregate import Aggregation
from weaverbird.pipeline.steps.totals import TotalDimension
from weaverbird.pipeline.types import ColumnName
from weaverbird.utils.iter import combinations


def make_totals_query(step: TotalsStep, parent_query: SQLQuery) -> (str, list[ColumnMetadata]):
    def select_total_dimensions(total_dimensions: list[TotalDimension]) -> list[ColumnMetadata]:
        selects = []
        for dimension in total_dimensions:
            selects.append(
                # in practice, it should be something called a `SelectField` if our queries were typed objects.
                # however this `ColumnMetadata` type has all I need.
                ColumnMetadata(
                    name=f"CASE WHEN GROUPING({dimension.total_column}) = 0 THEN {dimension.total_column} ELSE '{dimension.total_rows_label}' END",
                    alias=dimension.total_column,
                    type=parent_query.metadata_manager.retrieve_query_metadata_column_type_by_name(
                        dimension.total_column
                    ),
                )
            )
        return selects

    def select_aggregate(aggregations: Sequence[Aggregation]) -> list[ColumnMetadata]:
        aggregated_cols = []
        for aggregation in [
            aggregation
            for aggregation in aggregations
            if aggregation.agg_function not in ["first", "last"]
        ]:
            for col, new_col in zip(aggregation.columns, aggregation.new_columns):
                if aggregation.agg_function == "count distinct":
                    aggregated_cols.append(
                        ColumnMetadata(name=f"COUNT(DISTINCT {col})", alias=new_col, type="FLOAT")
                    )
                else:
                    aggregated_cols.append(
                        ColumnMetadata(
                            name=f"{aggregation.agg_function.upper()}({col})",
                            alias=new_col,
                            type="FLOAT",
                        )
                    )
        return aggregated_cols

    def with_alias(selects: list[ColumnMetadata]) -> list[str]:
        selects_with_alias = []
        for select in selects:
            select_str = select.original_name
            if select.alias is not None:
                select_str = f'{select_str} AS "{select.alias}"'
            selects_with_alias.append(select_str)
        return selects_with_alias

    total_dimensions: list[ColumnName] = list(map(lambda x: x.total_column, step.total_dimensions))

    selects: list[ColumnMetadata] = (
        select_total_dimensions(step.total_dimensions)
        + select_aggregate(step.aggregations)
        + [
            ColumnMetadata(
                name=column,
                type=parent_query.metadata_manager.retrieve_query_metadata_column_type_by_name(
                    column
                ),
            )
            for column in step.groups
        ]
    )

    group_sets = []
    for combination in combinations(total_dimensions):
        group_sets.append("(" + ", ".join(combination) + ")")
    group_sets.append("()")
    group_by = step.groups + ["GROUPING SETS(" + (", ".join(group_sets)) + ")"]

    query = f"""SELECT {', '.join(with_alias(selects))} FROM {parent_query.query_name} GROUP BY {', '.join(group_by)}"""

    return query, selects


def translate_totals(
    step: TotalsStep,
    query: SQLQuery,
    index: int,
    sql_query_retriever: SQLQueryRetriever = None,
    sql_query_describer: SQLQueryDescriber = None,
    sql_query_executor: SQLQueryExecutor = None,
    sql_translate_pipeline: SQLPipelineTranslator = None,
    subcall_from_other_pipeline_count: int = None,
    sql_dialect: SQLDialect = None,
) -> SQLQuery:
    query_name = f"TOTALS_STEP_{index}"

    log.debug(
        "############################################################"
        f"query_name: {query_name}\n"
        "------------------------------------------------------------"
        f"step: {step}\n"
        f"query.transformed_query: {query.transformed_query}\n"
        f"query.metadata_manager.query_metadata: {query.metadata_manager.retrieve_query_metadata()}\n"
    )

    sql_query, selects = make_totals_query(step, query)
    new_query = SQLQuery(
        query_name=query_name,
        transformed_query=f"{query.transformed_query}, {query_name} AS ({sql_query})",
    )

    new_query.metadata_manager = SqlQueryMetadataManager()
    [
        new_query.metadata_manager.add_query_metadata_column(
            select.alias if select.alias is not None else select.name, select.type
        )
        for select in selects
    ]

    new_query.selection_query = build_selection_query(
        new_query.metadata_manager.retrieve_query_metadata_columns(), query_name
    )
    log.debug(
        "------------------------------------------------------------"
        f"SQLquery: {new_query.transformed_query}"
        "############################################################"
    )

    return new_query
