from typing import List

from pydantic import Field

from weaverbird.pipeline.steps.utils.base import BaseStep
from weaverbird.pipeline.steps.utils.render_variables import StepWithVariablesMixin

from .utils.combination import PipelineOrDomainNameOrReference


class AppendStep(BaseStep):
    name = Field('append', const=True)
    pipelines: List[PipelineOrDomainNameOrReference]


class AppendStepWithVariable(AppendStep, StepWithVariablesMixin):
    ...
