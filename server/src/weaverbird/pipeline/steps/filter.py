from pydantic import Field

from weaverbird.pipeline.steps.utils.base import BaseStep
from weaverbird.pipeline.steps.utils.render_variables import StepWithVariablesMixin

from ..conditions import Condition


class FilterStep(BaseStep):
    name = Field('filter', const=True)
    condition: Condition


class FilterStepWithVariables(FilterStep, StepWithVariablesMixin):
    pass
