from pandas import DataFrame
from pydantic import Field

from weaverbird.conditions import Condition
from weaverbird.steps.base import BaseStep


class FilterStep(BaseStep):
    name = Field('filter', const=True)
    # TODO support and/or nesting
    condition: Condition

    def execute(self, df: DataFrame, domain_retriever=None, execute_pipeline=None) -> DataFrame:
        return df[self.condition.filter(df)]
