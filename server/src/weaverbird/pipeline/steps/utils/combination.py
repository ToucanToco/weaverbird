from collections.abc import Awaitable, Callable
from typing import TYPE_CHECKING, Literal

from pydantic import BaseModel

if TYPE_CHECKING:
    from weaverbird.pipeline.pipeline import PipelineStep


class Reference(BaseModel):
    type: Literal["ref"] = "ref"
    uid: str

    # Adding a prefix so is does not have the same hash as a domain whose name would be the same as
    # the uid
    def __hash__(self):
        return hash(f"__ref__{self.uid}")


PipelineOrDomainName = (
    list[dict] | list["PipelineStep"] | str
)  # can be either a domain name or a complete pipeline
PipelineOrDomainNameOrReference = PipelineOrDomainName | Reference

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
                return pipeline_without_refs.dict()["steps"]
            except ReferenceUnresolved:
                return None  # skip
        else:
            return pipeline_or_domain_name
    else:
        return pipeline_or_domain_name_or_ref
