import json
import logging
from typing import Tuple

from pandas import DataFrame
from pandas.io.json import build_table_schema

from weaverbird.backends.pandas_executor.steps import steps_executors
from weaverbird.backends.pandas_executor.types import (
    DomainRetriever,
    PipelineExecutionReport,
    StepExecutionReport,
)
from weaverbird.pipeline import Pipeline, PipelineStep
from weaverbird.utils import StopWatch, convert_size

logger = logging.getLogger(__name__)


def execute_pipeline(
    pipeline: Pipeline, domain_retriever: DomainRetriever
) -> Tuple[DataFrame, PipelineExecutionReport]:
    """
    The main function of the module. Execute a pipeline and returns the result as a pandas DataFrame.

    Its domain retriever will be use to retrieve data needed from `domains` steps.
    """
    # TODO validate the pipeline, e.g. the first step should always be a domain step
    # validate_pipeline()
    steps = pipeline.steps
    df = None
    stopwatch = StopWatch()
    step_reports = []
    for index, step in enumerate(steps):
        try:
            with stopwatch:
                df = steps_executors[step.name](
                    step,
                    df,
                    domain_retriever=domain_retriever,
                    execute_pipeline=execute_pipeline,
                )
            logger.info(
                f'step {step} used {convert_size(df.memory_usage().sum())}, took {stopwatch.interval}s to execute'
            )
            step_reports.append(
                StepExecutionReport(
                    step_index=index,
                    memory_used_in_bytes=df.memory_usage().sum(),
                    time_spent_in_ms=int(stopwatch.interval * 1000),
                )
            )
        except Exception as e:
            raise PipelineExecutionFailure(step, index, e) from e
    return df, PipelineExecutionReport(steps_reports=step_reports)


def preview_pipeline(
    pipeline: Pipeline, domain_retriever: DomainRetriever, limit: int = 50, offset: int = 0
) -> str:
    """
    Execute a pipeline but returns only a slice of the results, determined by `limit` and `offset` parameters, as JSON.

    Return format follows the 'table' JSON table schema used by pandas (see
    https://pandas.pydata.org/pandas-docs/stable/user_guide/io.html#orient-options), with a few addition related to
    pagination.

    Note: it's required to use pandas `to_json` methods, as it convert NaN and dates to an appropriate format.
    """
    df, _ = execute_pipeline(pipeline, domain_retriever)
    return json.dumps(
        {
            'schema': build_table_schema(df, index=False),
            'offset': offset,
            'limit': limit,
            'total': df.shape[0],
            'data': json.loads(df[offset : offset + limit].to_json(orient='records')),
        }
    )


class PipelineExecutionFailure(Exception):
    """ Raised when a error happens during the execution of the pipeline """

    def __init__(self, step: PipelineStep, index: int, original_exception: Exception):
        self.step = step
        self.index = index
        self.original_exception = original_exception
        self.message = f'Step #{index + 1} ({step.name}) failed: {original_exception}'
        self.details = {'index': index, 'message': self.message}
