from typing import Literal

from weaverbird.pipeline.steps.utils.base import BaseStep
from weaverbird.pipeline.steps.utils.render_variables import StepWithVariablesMixin

from .utils.combination import (
    PipelineOrDomainName,
    PipelineWithRefsOrDomainNameOrReference,
    ReferenceResolver,
    resolve_if_reference,
)


class BaseAppendStep(BaseStep):
    name: Literal["append"] = "append"


class AppendStep(BaseAppendStep):
    pipelines: list[PipelineOrDomainName]


class AppendStepWithVariable(AppendStep, StepWithVariablesMixin):
    ...


class AppendStepWithRefs(BaseAppendStep):
    pipelines: list[PipelineWithRefsOrDomainNameOrReference]

    async def resolve_references(self, reference_resolver: ReferenceResolver) -> AppendStepWithVariable | None:
        resolved_pipelines = [await resolve_if_reference(reference_resolver, p) for p in self.pipelines]
        resolved_pipelines_without_nones = [p for p in resolved_pipelines if p is not None]
        if len(resolved_pipelines_without_nones) == 0:
            return None  # skip the step
        return AppendStepWithVariable(
            name=self.name,
            pipelines=resolved_pipelines_without_nones,
        )
