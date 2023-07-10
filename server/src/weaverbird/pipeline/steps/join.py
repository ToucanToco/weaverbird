from typing import Literal

from pydantic import Field

from weaverbird.pipeline.steps.utils.base import BaseStep
from weaverbird.pipeline.steps.utils.render_variables import StepWithVariablesMixin
from weaverbird.pipeline.types import ColumnName

from .utils.combination import (
    PipelineOrDomainName,
    PipelineOrDomainNameOrReference,
    ReferenceResolver,
    resolve_if_reference,
)

JoinColumnsPair = tuple[ColumnName, ColumnName]


class BaseJoinStep(BaseStep):
    name: Literal["join"] = "join"
    type: Literal["left", "inner", "left outer"]
    on: list[JoinColumnsPair] = Field(..., min_items=1)


class JoinStep(BaseJoinStep):
    right_pipeline: PipelineOrDomainName


class JoinStepWithVariable(JoinStep, StepWithVariablesMixin):
    ...


class JoinStepWithRef(BaseJoinStep):
    right_pipeline: PipelineOrDomainNameOrReference

    async def resolve_references(
        self, reference_resolver: ReferenceResolver
    ) -> JoinStepWithVariable | None:
        right_pipeline = await resolve_if_reference(reference_resolver, self.right_pipeline)
        if right_pipeline is None:
            from ..references import ReferenceUnresolved

            raise ReferenceUnresolved()
        return JoinStepWithVariable(
            name=self.name,
            type=self.type,
            on=self.on,
            right_pipeline=right_pipeline,
        )
