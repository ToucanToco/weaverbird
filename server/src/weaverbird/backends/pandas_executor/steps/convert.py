from pandas import DataFrame

from weaverbird.backends.pandas_executor.types import DomainRetriever, PipelineExecutor
from weaverbird.pipeline.steps import ConvertStep

from .utils.cast import cast_to_bool, cast_to_datetime, cast_to_float, cast_to_int, cast_to_str

CAST_FUNCTIONS = {
    "integer": cast_to_int,
    "float": cast_to_float,
    "text": cast_to_str,
    "date": cast_to_datetime,
    "boolean": cast_to_bool,
}


def execute_convert(
    step: ConvertStep,
    df: DataFrame,
    domain_retriever: DomainRetriever = None,
    execute_pipeline: PipelineExecutor = None,
) -> DataFrame:
    cast_function = CAST_FUNCTIONS[step.data_type]
    transformed_columns = {col_name: cast_function(df[col_name]) for col_name in step.columns}
    return df.assign(**transformed_columns)
