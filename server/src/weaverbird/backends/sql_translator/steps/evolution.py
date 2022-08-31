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
from weaverbird.pipeline.steps import EvolutionStep


def translate_evolution(
    step: EvolutionStep,
    query: SQLQuery,
    index: int,
    sql_query_retriever: SQLQueryRetriever = None,
    sql_query_describer: SQLQueryDescriber = None,
    sql_query_executor: SQLQueryExecutor = None,
    sql_translate_pipeline: SQLPipelineTranslator = None,
    subcall_from_other_pipeline_count: int = None,
    sql_dialect: SQLDialect = None,
) -> SQLQuery:
    """
    Example of generated query (evolution on date column + 1 year, groupby orderstatus):
    SELECT A.O_TOTALPRICE AS P1, B.O_TOTALPRICE AS P2, A.O_ORDERDATE AS DATE, A.O_ORDERSTATUS as STAT,
    B.O_ORDERSTATUS AS STATB
    FROM ORDERS_TRUNC A
    LEFT JOIN ORDERS_TRUNC B
    ON A.O_ORDERDATE = DATEADD('year', 1, B.O_ORDERDATE) AND A.O_ORDERSTATUS = B.O_ORDERSTATUS
    WHERE DATEADD('year', 1, B.O_ORDERDATE) IS NULL OR B.O_ORDERSTATUS IS NULL
    """

    DATE_UNIT = {
        "vsLastYear": "year",
        "vsLastMonth": "month",
        "vsLastWeek": "week",
        "vsLastDay": "day",
    }

    query_name = f"EVOLUTION_STEP_{index}"
    new_column_name = (
        step.new_column.upper()
        if step.new_column
        else f"{step.value_col}_EVOL_{step.evolution_format.upper()}"
    )

    if step.evolution_format == "abs":
        new_column = f"""(A.{step.value_col} - B.{step.value_col}) AS {new_column_name}"""
    else:
        new_column = f"""((A.{step.value_col} / B.{step.value_col}) - 1) AS {new_column_name}"""

    selected_columns = [
        f"A.{c} AS {c}" for c in query.metadata_manager.retrieve_query_metadata_columns()
    ] + [new_column]

    date_join = (
        f"A.{step.date_col} = DATEADD('{DATE_UNIT[step.evolution_type]}', 1, B.{step.date_col})"
    )

    on_query = f"ON {' AND '.join([date_join]+[f'A.{c} = B.{c}' for c in step.index_columns])}"

    final_query = (
        f"SELECT {', '.join(selected_columns)}"
        f" FROM {query.query_name} A LEFT JOIN {query.query_name} B"
        f" {on_query} ORDER BY A.{step.date_col}"
    )

    transformed_query = f"{query.transformed_query}, {query_name} AS ({final_query})"

    query.metadata_manager.add_query_metadata_column(new_column_name, "float")

    return SQLQuery(
        query_name=query_name,
        transformed_query=transformed_query,
        selection_query=build_selection_query(
            query.metadata_manager.retrieve_query_metadata_columns(), query_name
        ),
        metadata_manager=query.metadata_manager,
    )
