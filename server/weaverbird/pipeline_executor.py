import json
import logging

from pandas import DataFrame
from pandas.io.json import build_table_schema

from weaverbird.pipeline import Pipeline, PipelineStep
from weaverbird.types import DomainRetriever
from weaverbird.utils import StopWatch, convert_size

logger = logging.getLogger(__name__)


class PipelineExecutor:
    """
    The main class of the module.

    Its domain retriever will be use to retrieve data needed from `domains` steps.
    """

    def __init__(self, domain_retriever: DomainRetriever):
        self.retrieve_domain = domain_retriever

    def execute_pipeline(self, pipeline: Pipeline) -> DataFrame:
        """
        Execute a pipeline and returns the result as a pandas DataFrame
        """
        # TODO validate the pipeline, e.g. the first step should always be a domain step
        # self.validate_pipeline()
        steps = pipeline.steps
        df = None
        stopwatch = StopWatch()
        for index, step in enumerate(steps):
            try:
                with stopwatch:
                    df = step.execute(
                        df,
                        domain_retriever=self.retrieve_domain,
                        execute_pipeline=self.execute_pipeline,
                    )
                logger.info(
                    f'step {step} used {convert_size(df.memory_usage().sum())}, took {stopwatch.interval}s to execute'
                )
            except Exception as e:
                raise PipelineExecutionFailure(step, index, e) from e
        return df

    def preview_pipeline(self, pipeline: Pipeline, limit: int = 50, offset: int = 0) -> str:
        """
        Execute a pipeline but returns only a slice of the results, determined by `limit` and `offset` parameters, as JSON.

        Return format follows the 'table' JSON table schema used by pandas (see
        https://pandas.pydata.org/pandas-docs/stable/user_guide/io.html#orient-options), with a few addition related to
        pagination.

        Note: it's required to use pandas `to_json` methods, as it convert NaN and dates to an appropriate format.
        """
        df = self.execute_pipeline(pipeline)
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
