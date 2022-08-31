from typing import Literal

from pydantic import Field

from weaverbird.pipeline.steps.utils.base import BaseStep
from weaverbird.pipeline.steps.utils.render_variables import StepWithVariablesMixin
from weaverbird.pipeline.types import ColumnName


class SplitStep(BaseStep):
    name: Literal["split"] = "split"
    column: ColumnName
    delimiter: str
    # at least one col to keep
    number_cols_to_keep: int = Field(gt=0)


class SplitStepWithVariable(SplitStep, StepWithVariablesMixin):
    ...
