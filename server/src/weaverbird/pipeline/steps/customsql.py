from typing import Literal

from weaverbird.pipeline.steps.utils.base import BaseStep
from weaverbird.pipeline.steps.utils.render_variables import StepWithVariablesMixin


class CustomSqlStep(BaseStep):
    name: Literal['customsql'] = 'customsql'
    query: str


class CustomSqlStepWithVariables(CustomSqlStep, StepWithVariablesMixin):
    ...
