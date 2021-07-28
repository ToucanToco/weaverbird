from weaverbird.backends.sql_translator.types import (
    SQLPipelineTranslator,
    SQLQuery,
    SQLQueryRetriever,
)
from weaverbird.pipeline.steps import AggregateStep


def translate_aggregate(
    step: AggregateStep,
    query: SQLQuery,
    index: int,
    sql_query_retriever: SQLQueryRetriever = None,
    sql_translate_pipeline: SQLPipelineTranslator = None,
) -> SQLQuery:
    aggregated_cols = []

    aggregated_string = ''
    first_last_string = ''

    for agg in step.aggregations:  # TODO the front should restrict - usage in column names
        agg.new_columns = [x.replace('-', '_') for x in agg.new_columns]

    for aggregation in [
        aggregation
        for aggregation in step.aggregations
        if aggregation.agg_function not in ['first', 'last']
    ]:
        for col, new_col in zip(aggregation.columns, aggregation.new_columns):
            if aggregation.agg_function == 'count distinct':
                aggregated_cols.append(f'COUNT(DISTINCT {col}) AS {new_col}')
            else:
                aggregated_cols.append(f'{aggregation.agg_function.upper()}({col}) AS {new_col}')
    if len(step.on) and len(aggregated_cols):
        aggregated_cols += step.on
        aggregated_string = f"SELECT {', '.join(aggregated_cols)} FROM {query.query_name} GROUP BY {', '.join(step.on)}"
    elif len(aggregated_cols):
        aggregated_string = f"SELECT {', '.join(aggregated_cols)} FROM {query.query_name}"

    first_cols, last_cols = [], []
    for aggregation in [
        aggregation
        for aggregation in step.aggregations
        if aggregation.agg_function in ['first', 'last']
    ]:
        for col, new_col in zip(aggregation.columns, aggregation.new_columns):
            if aggregation.agg_function == 'first':
                first_cols.append((col, new_col))
            else:
                last_cols.append((col, new_col))

    if len(first_cols) and not len(last_cols):
        if len(step.on):
            firsts_query = (
                f"SELECT {', '.join([f'{col} AS {new_col}' for (col, new_col) in first_cols] + step.on + ['ROW_NUMBER()'])} OVER (PARTITION BY {', '.join(step.on)} "
                f"ORDER BY {', '.join([c[0] for c in first_cols])}) AS R FROM {query.query_name} QUALIFY R = 1"
            )
            first_last_string = f"SELECT {', '.join([f'{c[1]}' for c in first_cols] + step.on)} FROM ({firsts_query})"

        else:
            firsts_query = (
                f"SELECT {', '.join(step.on + [f'{col} AS {new_col}' for (col, new_col) in first_cols] + ['ROW_NUMBER()'])} OVER ("
                f"ORDER BY {', '.join([c[0] for c in first_cols])}) AS R FROM {query.query_name} QUALIFY R = 1"
            )

            first_last_string = (
                f"SELECT {', '.join([f'{c[1]}' for c in first_cols])} FROM ({firsts_query})"
            )

    if len(last_cols) and not len(first_cols):
        if len(step.on):
            lasts_query = (
                f"SELECT {', '.join([f'{col} AS {new_col}' for (col, new_col) in last_cols] + step.on + ['ROW_NUMBER()'])} OVER (PARTITION BY {', '.join(step.on)} "
                f"ORDER BY {', '.join([f'{c[0]} DESC' for c in last_cols])}) AS R FROM {query.query_name} QUALIFY R = 1"
            )
            first_last_string = (
                f"SELECT {', '.join([f'{c[1]}' for c in last_cols] + step.on)} FROM ({lasts_query})"
            )

        else:
            lasts_query = (
                f"SELECT {', '.join(step.on + [f'{col} AS {new_col}' for (col, new_col) in last_cols] + ['ROW_NUMBER()'])} OVER ("
                f"ORDER BY {', '.join([f'{c[0]} DESC' for c in last_cols])}) AS R FROM {query.query_name} QUALIFY R = 1"
            )
            first_last_string = (
                f"SELECT {', '.join([f'{c[1]}' for c in last_cols])} FROM ({lasts_query})"
            )

    if len(last_cols) and len(first_cols):
        if len(step.on):
            firsts_and_lasts_query = (
                f"SELECT {', '.join([f'{col} AS {new_col}' for (col, new_col) in first_cols] + [f'{col} AS {new_col}' for (col, new_col) in last_cols] + step.on + ['ROW_NUMBER()'])} OVER (PARTITION BY {', '.join(step.on)} "
                f"ORDER BY {', '.join([f'{c[0]}' for c in first_cols] + [f'{c[0]} DESC' for c in last_cols])}) AS R FROM {query.query_name} QUALIFY R = 1"
            )
            first_last_string = f"SELECT {', '.join([f'{c[1]}' for c in first_cols] + [f'{c[1]}' for c in last_cols] + step.on)} FROM ({firsts_and_lasts_query})"

        else:
            firsts_and_lasts_query = (
                f"SELECT {', '.join(step.on + [f'{col} AS {new_col}' for (col, new_col) in first_cols] + [f'{col} AS {new_col}' for (col, new_col) in last_cols] + ['ROW_NUMBER()'])} OVER ("
                f"ORDER BY {', '.join([f'{c[0]}' for c in first_cols] + [f'{c[0]} DESC' for c in last_cols])}) AS R FROM {query.query_name} QUALIFY R = 1"
            )
            first_last_string = f"SELECT {', '.join([f'{c[1]}' for c in first_cols] + [f'{c[1]}' for c in last_cols])} FROM ({firsts_and_lasts_query})"

    if len(aggregated_string) and len(first_last_string):
        if len(step.on):
            query_string = f"SELECT A.*, {', '.join([f'F.{c[1]}' for c in first_cols + last_cols])} FROM ({aggregated_string}) A INNER JOIN ({first_last_string}) F ON {' AND '.join([f'A.{s}=F.{s}' for s in step.on])}"
        else:
            query_string = f"SELECT A.*, {', '.join([f'F.{c[1]}' for c in first_cols + last_cols])} FROM ({aggregated_string}) A INNER JOIN ({first_last_string}) F"

    elif len(aggregated_string):
        query_string = aggregated_string
    else:
        query_string = first_last_string

    return SQLQuery(
        query_name=f'AGGREGATE_STEP_{index}',
        selection_query=f"""SELECT * FROM {f'AGGREGATE_STEP_{index}'}""",
        transformed_query=f'{query.transformed_query}, AGGREGATE_STEP_{index} AS ({query_string})',
    )
