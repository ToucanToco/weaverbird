from typing import List, Literal, Tuple, Union

from pandas import DataFrame, merge
from pydantic import Field

from weaverbird.render_variables import StepWithVariablesMixin
from weaverbird.steps.base import BaseStep
from weaverbird.steps.combination import PipelineOrDomainName, resolve_pipeline_for_combination
from weaverbird.types import ColumnName, DomainRetriever, PipelineExecutor
from weaverbird.utils import rename_duplicated_columns

JoinColumnsPair = Tuple[ColumnName, ColumnName]


class JoinStep(BaseStep):
    name = Field('join', const=True)
    right_pipeline: Union[PipelineOrDomainName]
    type: Literal['left', 'inner', 'left outer']
    on: List[JoinColumnsPair] = Field(..., min_items=1)

    def execute(
        self,
        df: DataFrame,
        domain_retriever: DomainRetriever,
        execute_pipeline: PipelineExecutor,
    ) -> DataFrame:
        right_df = resolve_pipeline_for_combination(
            self.right_pipeline, domain_retriever, execute_pipeline
        )

        if self.type == 'left outer':
            how = 'outer'
        else:
            how = self.type

        result = merge(
            df,
            right_df,
            left_on=[o[0] for o in self.on],
            right_on=[o[1] for o in self.on],
            how=how,
            suffixes=('', '_JOIN'),
        )
        return rename_duplicated_columns(result)


class JoinStepWithVariable(JoinStep, StepWithVariablesMixin):
    ...
