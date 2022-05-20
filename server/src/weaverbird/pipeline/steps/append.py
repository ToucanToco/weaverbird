from typing import List, Literal

from weaverbird.pipeline.steps.utils.base import BaseStep
from weaverbird.pipeline.steps.utils.render_variables import StepWithVariablesMixin

from .utils.combination import PipelineOrDomainNameOrReference


class AppendStep(BaseStep):
    name: Literal['append'] = 'append'
    pipelines: List[PipelineOrDomainNameOrReference]


class AppendStepWithVariable(AppendStep, StepWithVariablesMixin):
    ...
