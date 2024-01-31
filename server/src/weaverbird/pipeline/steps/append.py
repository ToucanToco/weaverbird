from typing import Literal, Self

from weaverbird.pipeline.steps.utils.base import BaseStep
from weaverbird.pipeline.steps.utils.render_variables import StepWithVariablesMixin

from .utils.combination import (
    PipelineOrDomainNameOrReference,
    ReferenceResolver,
    resolve_if_reference,
)


class BaseAppendStep(BaseStep):
    name: Literal["append"] = "append"


class AppendStep(BaseAppendStep):
    pipelines: list[PipelineOrDomainNameOrReference]

    async def resolve_references(self, reference_resolver: ReferenceResolver) -> Self | None:
        resolved_pipelines = [await resolve_if_reference(reference_resolver, p) for p in self.pipelines]
        resolved_pipelines_without_nones = [p for p in resolved_pipelines if p is not None]
        if len(resolved_pipelines_without_nones) == 0:
            return None  # skip the step
        return self.__class__(
            name=self.name,
            pipelines=resolved_pipelines_without_nones,
        )


class AppendStepWithVariable(AppendStep, StepWithVariablesMixin):
    ...
