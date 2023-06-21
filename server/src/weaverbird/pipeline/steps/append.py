from typing import Literal

from weaverbird.pipeline.steps.utils.base import BaseStep
from weaverbird.pipeline.steps.utils.render_variables import StepWithVariablesMixin

from .utils.combination import (
    PipelineOrDomainName,
    PipelineOrDomainNameOrReference,
    ReferenceResolver,
    resolve_if_reference,
)


class AppendStepWithRefs(BaseStep):
    name: Literal["append"] = "append"
    pipelines: list[PipelineOrDomainNameOrReference]

    async def resolve_references(
        self, reference_resolver: ReferenceResolver
    ) -> "AppendStepWithVariable":
        return AppendStepWithVariable(
            name=self.name,
            pipelines=[await resolve_if_reference(reference_resolver, p) for p in self.pipelines],
        )


class AppendStep(AppendStepWithRefs):
    pipelines: list[PipelineOrDomainName]


class AppendStepWithVariable(AppendStep, StepWithVariablesMixin):
    ...


AppendStepWithVariable.update_forward_refs()
