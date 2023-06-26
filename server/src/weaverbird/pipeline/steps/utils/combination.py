from typing import Awaitable, Callable, Literal

from pydantic import BaseModel


class Reference(BaseModel):
    type: Literal["ref"] = "ref"
    uid: str

    # Adding a prefix so is does not have the same hash as a domain whose name would be the same as
    # the uid
    def __hash__(self):
        return hash(f"__ref__{self.uid}")


PipelineOrDomainName = list[dict] | str  # can be either a domain name or a complete pipeline
PipelineOrDomainNameOrReference = PipelineOrDomainName | Reference

ReferenceResolver = Callable[[Reference], Awaitable[PipelineOrDomainName]]


async def resolve_if_reference(
    reference_resolver: ReferenceResolver,
    pipeline_or_domain_name_or_ref: PipelineOrDomainNameOrReference,
) -> PipelineOrDomainName:
    from weaverbird.pipeline.references import PipelineWithRefs

    if isinstance(pipeline_or_domain_name_or_ref, Reference):
        pipeline_or_domain_name = await reference_resolver(pipeline_or_domain_name_or_ref)
        if isinstance(pipeline_or_domain_name, list):
            # Recursively resolve any reference in sub-pipelines
            pipeline = PipelineWithRefs(steps=pipeline_or_domain_name)
            pipeline_without_refs = await pipeline.resolve_references(reference_resolver)
            return pipeline_without_refs.dict()["steps"]
        else:
            return pipeline_or_domain_name
    else:
        return pipeline_or_domain_name_or_ref
