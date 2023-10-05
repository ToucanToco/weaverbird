from pandas import DataFrame

from weaverbird.backends.pandas_executor.types import DomainRetriever, PipelineExecutor
from weaverbird.pipeline.steps import TimeExtractStep


def execute_timeextract(
    step: TimeExtractStep,
    df: DataFrame,
    domain_retriever: DomainRetriever = None,
    execute_pipeline: PipelineExecutor = None,
) -> DataFrame:
    for time_info, new_col in zip(step.time_info, step.new_columns, strict=True):
        match time_info:
            case "days":
                df[new_col] = df[step.column].dt.days
            case "hours":
                df[new_col] = df[step.column].dt.seconds // (60 * 60)
            case "minutes":
                total_hours = df[step.column].dt.seconds // (60 * 60)
                df[new_col] = (df[step.column].dt.seconds - total_hours * 60 * 60) // 60
            case "seconds":
                total_hours = df[step.column].dt.seconds // (60 * 60)
                total_minutes = (df[step.column].dt.seconds - total_hours * 60 * 60) // 60
                df[new_col] = (
                    df[step.column].dt.seconds - total_hours * 60 * 60 - total_minutes * 60
                )
            case "milliseconds":
                df[new_col] = df[step.column].dt.microseconds // 1000
            case "total_days":
                df[new_col] = df[step.column].dt.total_seconds() / (60 * 60 * 24)
            case "total_hours":
                df[new_col] = df[step.column].dt.total_seconds() / (60 * 60)
            case "total_minutes":
                df[new_col] = df[step.column].dt.total_seconds() / 60
            case "total_seconds":
                df[new_col] = df[step.column].dt.total_seconds()
            case "total_milliseconds":
                df[new_col] = (
                    df[step.column].dt.total_seconds().astype(int) * 1000
                    + df[step.column].dt.microseconds // 1000
                )
            case _:
                raise ValueError(f"Invalid time_info: {time_info}")
    return df
