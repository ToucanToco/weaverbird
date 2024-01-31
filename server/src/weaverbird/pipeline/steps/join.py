from typing import TYPE_CHECKING, Literal, Self, TypeVar

from pydantic import Field

from weaverbird.pipeline.steps.utils.base import BaseStep
from weaverbird.pipeline.steps.utils.render_variables import StepWithVariablesMixin
from weaverbird.pipeline.types import ColumnName

if TYPE_CHECKING:
    from weaverbird.pipeline.pipeline import Pipeline, PipelineWithVariables

    PipelineType = TypeVar("PipelineType", bound=Pipeline | PipelineWithVariables)

from .utils.combination import (
    PipelineOrDomainNameOrReference,
    PipelineWithVariablesOrDomainNameOrReference,
    ReferenceResolver,
    resolve_if_reference,
)

JoinColumnsPair = tuple[ColumnName, ColumnName]


class BaseJoinStep(BaseStep):
    name: Literal["join"] = "join"
    type: Literal["left", "inner", "left outer"]
    on: list[JoinColumnsPair] = Field(..., min_length=1)


class JoinStep(BaseJoinStep):
    right_pipeline: PipelineOrDomainNameOrReference

    async def resolve_references(
        self, reference_resolver: ReferenceResolver, parent_pipeline: "PipelineType"
    ) -> Self | None:
        right_pipeline = await resolve_if_reference(reference_resolver, self.right_pipeline)
        if right_pipeline is None:
            from weaverbird.pipeline.pipeline import ReferenceUnresolved

            raise ReferenceUnresolved()
        return self.__class__(
            name=self.name,
            type=self.type,
            on=self.on,
            right_pipeline=right_pipeline,
        )


class JoinStepWithVariable(JoinStep, StepWithVariablesMixin):
    right_pipeline: PipelineWithVariablesOrDomainNameOrReference
