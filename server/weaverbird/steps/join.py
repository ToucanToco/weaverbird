from typing import List, Literal, Tuple, Union

from pandas import DataFrame, merge
from pydantic import Field

from weaverbird.steps.base import BaseStep
from weaverbird.types import ColumnName, DomainRetriever, PipelineExecutor

JoinColumnsPair = Tuple[ColumnName, ColumnName]


class JoinStep(BaseStep):
    name = Field('join', const=True)
    right_pipeline: Union[List[dict], str]
    type: Literal['left', 'inner', 'left outer']
    on: List[JoinColumnsPair] = Field(..., min_items=1)

    def execute(
        self,
        df: DataFrame,
        domain_retriever: DomainRetriever,
        execute_pipeline: PipelineExecutor,
    ) -> DataFrame:
        if isinstance(self.right_pipeline, str):
            # right_pipeline can be a domain name...
            right_df = domain_retriever(self.right_pipeline)
        else:
            # ...or a complete pipeline
            right_df = execute_pipeline(self.right_pipeline)

        if self.type == 'left outer':
            how = 'outer'
        else:
            how = self.type

        return merge(
            df,
            right_df,
            left_on=[o[0] for o in self.on],
            right_on=[o[1] for o in self.on],
            how=how,
        )
