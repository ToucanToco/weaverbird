from typing import Literal, Union

from weaverbird.pipeline.steps.utils.base import BaseStep
from weaverbird.pipeline.steps.utils.combination import (
    Reference,
    ReferenceResolver,
    resolve_if_reference,
)


class DomainStepWithRef(BaseStep):
    name: Literal["domain"] = "domain"
    domain: str | Reference

    async def resolve_references(
        self, reference_resolver: ReferenceResolver
    ) -> Union["DomainStep", "PipelineWithVariables"]:
        """
        This resolution can return a whole pipeline, which needs to replace the step.
        Not that the resulting array must be flattened:
        it should look like [step 1, step 2, step 3], not [[step 1, step 2], step 3]
        """
        from weaverbird.pipeline.pipeline import PipelineWithRefs

        resolved = await resolve_if_reference(reference_resolver, self.domain)
        if isinstance(resolved, list):
            return await PipelineWithRefs(steps=resolved).resolve_references(reference_resolver)
        else:
            return DomainStep(
                name=self.name,
                domain=resolved,
            )


class DomainStep(DomainStepWithRef):
    domain: str


DomainStep.update_forward_refs()
