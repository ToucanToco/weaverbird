from typing import Any

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
        boolean_results = self.condition.filter(df)
        # then I replace all True values by the 'then' and all False values by the 'else'
        new_values = boolean_results.replace({True: self.then, False: self.else_value})
        # finally, I add this new column to the dataframe
        return df.assign(**{self.new_column: new_values})
