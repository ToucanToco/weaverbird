from typing import Literal

from pydantic import Field

from weaverbird.pipeline.steps.utils.base import BaseStep
from weaverbird.pipeline.steps.utils.render_variables import StepWithVariablesMixin
from weaverbird.pipeline.types import ColumnName, TemplatedVariable


class RankStep(BaseStep):
    name: Literal["rank"] = "rank"
    value_col: ColumnName = Field(alias="valueCol")
    order: Literal["asc", "desc"]
    method: Literal["standard", "dense"]
    groupby: list[ColumnName] = []
    new_column_name: ColumnName | None = Field(None, alias="newColumnName")


class RankStepWithVariable(RankStep, StepWithVariablesMixin):
    groupby: TemplatedVariable | list[TemplatedVariable]
