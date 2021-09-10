from pydantic import Field

from weaverbird.pipeline.steps.utils.base import BaseStep
from weaverbird.pipeline.steps.utils.render_variables import StepWithVariablesMixin


class CustomSqlStep(BaseStep):
    name = Field('customsql', const=True)
    query: str


class CustomSqlStepWithVariables(CustomSqlStep, StepWithVariablesMixin):
    name = Field('customsql', const=True)
    query: str
