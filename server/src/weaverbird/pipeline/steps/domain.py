from typing import TYPE_CHECKING, Literal, TypeVar

from weaverbird.pipeline.steps.utils.base import BaseStep
from weaverbird.pipeline.steps.utils.combination import (
    Reference,
    ReferenceResolver,
    resolve_if_reference,
)

if TYPE_CHECKING:
    from weaverbird.pipeline.pipeline import Pipeline, PipelineWithVariables

    PipelineType = TypeVar("PipelineType", bound=Pipeline | PipelineWithVariables)


class DomainStep(BaseStep):
    name: Literal["domain"] = "domain"
    domain: str | Reference

    async def resolve_references(
        self, reference_resolver: ReferenceResolver, parent_pipeline: "PipelineType"
    ) -> "DomainStep | PipelineType":
        """
        This resolution can return a whole pipeline, which needs to replace the step.
        Not that the resulting array must be flattened:
        it should look like [step 1, step 2, step 3], not [[step 1, step 2], step 3]
        """
        from weaverbird.pipeline.pipeline import ReferenceUnresolved

        resolved = await resolve_if_reference(reference_resolver, self.domain)
        if isinstance(resolved, list):
            return await parent_pipeline.__class__(steps=resolved).resolve_references(reference_resolver)
        elif resolved is None:
            raise ReferenceUnresolved()
        else:
            return DomainStep(
                name=self.name,
                domain=resolved,
            )
