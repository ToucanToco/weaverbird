from typing import Annotated

from pydantic import BaseModel, Field

from .pipeline import PipelineStep, PipelineStepWithVariables, PipelineWithVariables
from .steps import AppendStepWithRefs, DomainStepWithRef, JoinStepWithRef
from .steps.utils.combination import ReferenceResolver

PipelineStepWithRefs = Annotated[
    AppendStepWithRefs | DomainStepWithRef | JoinStepWithRef,
    Field(discriminator="name"),  # noqa: F821
]


class PipelineWithRefs(BaseModel):
    """
    Represents a pipeline in which some steps can reference some other pipelines using the syntax
    `{"type": "ref", "uid": "..."}`
    """

    steps: list[PipelineStepWithRefs | PipelineStepWithVariables | PipelineStep]

    async def resolve_references(
        self, reference_resolver: ReferenceResolver
    ) -> PipelineWithVariables:
        """
        Walk the pipeline steps and replace any reference by its corresponding pipeline.
        The sub-pipelines added should also be handled, so that they will be no references anymore in the result.
        """
        resolved_steps: list[PipelineStepWithRefs | PipelineStepWithVariables | PipelineStep] = []
        for step in self.steps:
            resolved_step = (
                await step.resolve_references(reference_resolver)
                if hasattr(step, "resolve_references")
                else step
            )
            if isinstance(resolved_step, PipelineWithVariables):
                resolved_steps.extend(resolved_step.steps)
            else:
                resolved_steps.append(resolved_step)

        return PipelineWithVariables(steps=resolved_steps)
