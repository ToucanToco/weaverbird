from pandas import DataFrame

from weaverbird.backends.pandas_executor.types import DomainRetriever, PipelineExecutor
from weaverbird.pipeline.steps import SubstringStep


def execute_substring(
    step: SubstringStep,
    df: DataFrame,
    domain_retriever: DomainRetriever = None,
    execute_pipeline: PipelineExecutor = None,
) -> DataFrame:
    new_column_name = step.new_column_name or f"{step.column}_SUBSTR"
    # Weaverbird indexes start at one
    start_index = step.start_index - 1
    # Weaverbird substring end_index is inclusive. in python, it is exclusive.
    # Therefore, no need to substract one
    end_index = step.end_index

    if end_index < 0:
        end_index += 1
    if start_index < 0:
        start_index += 1

    # there is no way to get the full string with a x[start:end] when end is negative.
    if end_index == 0:
        serie = df[step.column].str[start_index:]
    else:
        serie = df[step.column].str[start_index:end_index]

    return df.assign(**{new_column_name: serie})
