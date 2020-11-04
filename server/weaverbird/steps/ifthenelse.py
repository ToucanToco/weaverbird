from typing import Any

import numpy
from pandas import DataFrame
from pydantic import Field

from weaverbird.steps import BaseStep
from weaverbird.steps.filter import Condition
from weaverbird.types import ColumnName, DomainRetriever, PipelineExecutor


class IfthenelseStep(BaseStep):
    new_column: ColumnName = Field(alias='newColumn')
    condition: Condition = Field(alias='if')
    then: Any
    else_value: Any = Field(alias='else')

    def execute(
        self,
        df: DataFrame,
        domain_retriever: DomainRetriever = None,
        execute_pipeline: PipelineExecutor = None,
    ) -> DataFrame:
        # first, I make a series with the True / False result of the condition

        return df.assign(
            **{
                self.new_column: numpy.where(
                    self.condition.filter(df), df.eval(self.then), df.eval(self.else_value)
                )
            }
        )
