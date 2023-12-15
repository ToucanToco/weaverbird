from collections.abc import Awaitable, Callable, Iterable
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


def _ensure_is_pipeline_step(
    v: str | list[dict] | list["PipelineStep"],
) -> str | list["PipelineStep"]:
    from weaverbird.pipeline.pipeline import PipelineStep

    adapter = TypeAdapter(PipelineStep)
    if isinstance(v, str):
        return v

    def iter_() -> Iterable["PipelineStep"]:
        for elem in v:
            if isinstance(elem, dict):
                yield adapter.validate_python(elem)
            else:
                yield elem

    out = list(iter_())
    return out


# can be either a domain name or a complete pipeline
PipelineOrDomainName = Annotated[
    str | list["PipelineStep"], BeforeValidator(_ensure_is_pipeline_step)
]


def _ensure_is_pipeline_step_with_ref(
    v: str | list[dict] | list["PipelineStep | PipelineStepWithRefs"],
) -> str | list["PipelineStep"]:
    from weaverbird.pipeline.pipeline import PipelineStep, PipelineStepWithRefs

    adapter = TypeAdapter(PipelineStepWithRefs | PipelineStep)
    if isinstance(v, str):
        return v

    def iter_() -> Iterable["PipelineStepWithRefs | PipelineStep"]:
        for elem in v:
            if isinstance(elem, dict):
                yield adapter.validate_python(elem)
            else:
                yield elem

    out = list(iter_())
    return out


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
