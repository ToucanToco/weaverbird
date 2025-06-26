from pandas import DataFrame, to_datetime

from weaverbird.backends.pandas_executor.types import DomainRetriever, PipelineExecutor
from weaverbird.pipeline.steps import ToDateStep

_FR_TO_EN_MONTHS_LONG = [
    ("janvier", "january"),
    ("février", "february"),
    ("fevrier", "february"),
    ("mars", "march"),
    ("avril", "april"),
    ("mai", "may"),
    ("juin", "june"),
    ("juillet", "july"),
    ("août", "august"),
    ("aout", "august"),
    ("septembre", "september"),
    ("octobre", "october"),
    ("novembre", "november"),
    ("décembre", "december"),
    ("decembre", "december"),
]

_FR_TO_EN_MONTHS_SHORT = [
    ("janv", "jan"),
    ("févr", "feb"),
    ("fevr", "feb"),
    ("mars", "mar"),
    ("avr", "apr"),
    ("mai", "may"),
    ("juin", "jun"),
    ("juil", "jul"),
    ("août", "aug"),
    ("aout", "aug"),
    ("sept", "sep"),
    ("oct", "oct"),
    ("nov", "nov"),
    ("déc", "dec"),
]


def execute_todate(
    step: ToDateStep,
    df: DataFrame,
    domain_retriever: DomainRetriever = None,
    execute_pipeline: PipelineExecutor = None,
) -> DataFrame:
    format = step.format
    timestamp_unit = None

    if format is None and df[step.column].dtype == "int64":
        # By default int are understood as timestamps, we prefer to convert it to %Y format if values are < 10_000
        if df[step.column].max() < 10_000:
            format = "%Y"
        else:
            # Timestamps are expected in ms (not in ns, which is pandas' default)
            timestamp_unit = "ms"

    if format is not None and ("%b" in format or "%B" in format):
        replacements = _FR_TO_EN_MONTHS_SHORT if "%b" in format else _FR_TO_EN_MONTHS_LONG
        col = df[step.column].str.lower()
        for french_month, english_month in replacements:
            col = col.str.replace(french_month, english_month)
        df[step.column] = col

    datetime_serie = to_datetime(df[step.column], format=format, errors="coerce", unit=timestamp_unit)
    return df.assign(**{step.column: datetime_serie})
