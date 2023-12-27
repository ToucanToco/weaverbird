from typing import Literal

from weaverbird.pipeline.steps.utils.base import BaseStep
from weaverbird.pipeline.steps.utils.render_variables import StepWithVariablesMixin

from ..conditions import Condition, ConditionWithVariables


class BaseFilterStep(BaseStep):
    name: Literal["filter"] = "filter"


class FilterStep(BaseFilterStep):
    condition: Condition


class FilterStepWithVariables(BaseFilterStep, StepWithVariablesMixin):
    condition: ConditionWithVariables
