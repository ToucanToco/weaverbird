from collections.abc import Awaitable, Callable
from functools import cache
from typing import TYPE_CHECKING, Annotated, Literal

from pydantic import BaseModel, BeforeValidator, TypeAdapter

if TYPE_CHECKING:
    from weaverbird.pipeline.pipeline import PipelineStep, PipelineStepWithRefs


class Reference(BaseModel):
    type: Literal["ref"] = "ref"
    uid: str

    # Adding a prefix so is does not have the same hash as a domain whose name would be the same as
    # the uid
    def __hash__(self):
        return hash(f"__ref__{self.uid}")


# FIXME: Required because of https://github.com/pydantic/pydantic/issues/7487.
# Repro case:
# {
#     "name": "append",
#     "pipelines": [
#         [
#             {"name": "domain", "domain": "styles"},
#             {
#                 "name": "join",
#                 "type": "inner",
#                 "right_pipeline": [
#                     {"name": "domain", "domain": "beers"},
#                     {"name": "uppercase", "column": "a"},
#                     {"name": "uppercase", "column": "b"},
#                 ],
#                 "on": [("style", "name")],
#             },
#         ],
#         [
#             {"name": "domain", "domain": "beers"},
#             {"name": "uppercase", "column": "a"},
#         ],
#     ],
# }


# Instantiating a TypeAdapter is costly, so we do it here in a cached function
@cache
def _pipelinestep_adapter() -> TypeAdapter["str | list[PipelineStep]"]:
    from weaverbird.pipeline.pipeline import PipelineStep

    # mypy is confused by the type with a postponed annotation above, so it expects str | list[Any]
    # here
    return TypeAdapter(str | list[PipelineStep])  # type: ignore[arg-type]


@cache
def _pipelinestepwithref_adapter() -> TypeAdapter["str | list[PipelineStepWithRefs | PipelineStep]"]:
    from weaverbird.pipeline.pipeline import PipelineStep, PipelineStepWithRefs

    return TypeAdapter(str | list[PipelineStepWithRefs | PipelineStep])  # type: ignore[arg-type]


def _ensure_is_pipeline_step(
    v: str | list[dict] | list["PipelineStep"],
) -> str | list["PipelineStep"]:
    return _pipelinestep_adapter().validate_python(v)


# can be either a domain name or a complete pipeline
PipelineOrDomainName = Annotated[str | list["PipelineStep"], BeforeValidator(_ensure_is_pipeline_step)]


def _ensure_is_pipeline_step_with_ref(
    v: str | list[dict] | list["PipelineStep | PipelineStepWithRefs"],
) -> str | list["PipelineStep | PipelineStepWithRefs"]:
    return _pipelinestepwithref_adapter().validate_python(v)


# can be either a domain name or a complete pipeline
PipelineWithRefsOrDomainName = Annotated[
    str | list["PipelineStepWithRefs | PipelineStep"],
    BeforeValidator(_ensure_is_pipeline_step_with_ref),
]


PipelineOrDomainNameOrReference = PipelineOrDomainName | Reference
PipelineWithRefsOrDomainNameOrReference = PipelineWithRefsOrDomainName | Reference

# A reference returning None means that it should be skipped
ReferenceResolver = Callable[[Reference], Awaitable[PipelineOrDomainName | None]]


async def resolve_if_reference(
    reference_resolver: ReferenceResolver,
    pipeline_or_domain_name_or_ref: PipelineOrDomainNameOrReference,
) -> PipelineOrDomainName | None:
    from weaverbird.pipeline.pipeline import PipelineWithRefs, ReferenceUnresolved

    if isinstance(pipeline_or_domain_name_or_ref, Reference):
        pipeline_or_domain_name = await reference_resolver(pipeline_or_domain_name_or_ref)
        if isinstance(pipeline_or_domain_name, list):
            # Recursively resolve any reference in sub-pipelines
            pipeline = PipelineWithRefs(steps=pipeline_or_domain_name)

            try:
                pipeline_without_refs = await pipeline.resolve_references(reference_resolver)
                return pipeline_without_refs.model_dump()["steps"]
            except ReferenceUnresolved:
                return None  # skip
        else:
            return pipeline_or_domain_name
    else:
        return pipeline_or_domain_name_or_ref
