from collections.abc import Awaitable, Callable
from typing import Annotated, Any, Literal

from pydantic import BaseModel, BeforeValidator

from weaverbird.pipeline.steps.utils.base import BaseStep


class Reference(BaseModel):
    type: Literal["ref"] = "ref"
    uid: str

    # Adding a prefix so is does not have the same hash as a domain whose name would be the same as
    # the uid
    def __hash__(self):
        return hash(f"__ref__{self.uid}")


def _convert_basestep_to_dict(value: Any) -> Any:
    if isinstance(value, BaseStep):
        return value.model_dump()
    elif isinstance(value, list) and all(isinstance(v, BaseStep) for v in value):
        return [v.model_dump() for v in value]
    return value


# FIXME: pydantic v2 is stricter with typing, and requires this to be
# list[dict] | str | PipelineStep. However it would result in a circular import.
# In python 3.11, importing the PipelineStep only when TYPE_CHECKING is True works,
# but seems a bit hacky. So this ensures that the input can only be a dict
PipelineOrDomainName = Annotated[
    list[dict] | str, BeforeValidator(_convert_basestep_to_dict)
]  # can be either a domain name or a complete pipeline
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
                return pipeline_without_refs.model_dump()["steps"]
            except ReferenceUnresolved:
                return None  # skip
        else:
            return pipeline_or_domain_name
    else:
        return pipeline_or_domain_name_or_ref
