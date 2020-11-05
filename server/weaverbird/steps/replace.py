from typing import Any, List, Tuple

from pandas import DataFrame
from pydantic import Field

from weaverbird.steps import BaseStep
from weaverbird.types import ColumnName, DomainRetriever, PipelineExecutor


class ReplaceStep(BaseStep):
    name = Field('replace', const=True)
    search_column: ColumnName
    to_replace: List[Tuple[Any, Any]] = Field(min_items=1)

    def execute(
        self,
        df: DataFrame,
        domain_retriever: DomainRetriever = None,
        execute_pipeline: PipelineExecutor = None,
    ) -> DataFrame:
        return df.assign(
            **{
                self.search_column: df[self.search_column].replace(
                    {old_value: new_value for (old_value, new_value) in self.to_replace}
                )
            }
        )
