import pytest

from weaverbird.pipeline.pipeline import Pipeline, PipelineWithVariables
from weaverbird.pipeline.references import PipelineWithRefs
from weaverbird.pipeline.steps import (
    AppendStepWithRefs,
    DomainStep,
    DomainStepWithRef,
    JoinStep,
    JoinStepWithRef,
    TextStep,
)
from weaverbird.pipeline.steps.utils.combination import Reference

PIPELINES_LIBRARY: dict[str, list[dict]] = {
    "source_pipeline": Pipeline(
        steps=[
            DomainStep(domain="source"),
        ]
    ).dict()["steps"],
    "intermediate_pipeline": PipelineWithRefs(
        steps=[
            DomainStepWithRef(domain=Reference(uid="source_pipeline")),
            TextStep(new_column="meow", text="Cat"),
        ]
    ).dict()["steps"],
    "other_pipeline": Pipeline(
        steps=[
            DomainStep(domain="other_source"),
            TextStep(new_column="comes_from", text="other"),
        ]
    ).dict()["steps"],
}


async def reference_resolver(ref: Reference) -> list[dict]:
    return PIPELINES_LIBRARY[ref.uid]


@pytest.mark.asyncio
async def test_resolve_references_domain():
    pipeline_with_refs = PipelineWithRefs(
        steps=[
            DomainStepWithRef(domain=Reference(uid="source_pipeline")),
            TextStep(new_column="text", text="Lorem ipsum"),
        ]
    )
    assert await pipeline_with_refs.resolve_references(reference_resolver) == PipelineWithVariables(
        steps=[
            DomainStep(domain="source"),
            TextStep(new_column="text", text="Lorem ipsum"),
        ]
    )


@pytest.mark.asyncio
async def test_resolve_references_recursive():
    pipeline_with_refs = PipelineWithRefs(
        steps=[
            DomainStepWithRef(domain=Reference(uid="intermediate_pipeline")),
            TextStep(new_column="text", text="Lorem ipsum"),
        ]
    )
    assert await pipeline_with_refs.resolve_references(reference_resolver) == PipelineWithVariables(
        steps=[
            DomainStep(domain="source"),
            TextStep(new_column="meow", text="Cat"),
            TextStep(new_column="text", text="Lorem ipsum"),
        ]
    )


@pytest.mark.asyncio
async def test_resolve_references_join():
    pipeline_with_refs = PipelineWithRefs(
        steps=[
            DomainStepWithRef(domain="source"),
            JoinStepWithRef(
                on=[("key_left", "key_right")],
                right_pipeline=Reference(uid="other_pipeline"),
                type="left",
            ),
            TextStep(new_column="text", text="Lorem ipsum"),
        ]
    )
    assert await pipeline_with_refs.resolve_references(reference_resolver) == PipelineWithVariables(
        steps=[
            DomainStep(domain="source"),
            JoinStep(
                on=[("key_left", "key_right")],
                right_pipeline=PIPELINES_LIBRARY["other_pipeline"],
                type="left",
            ),
            TextStep(new_column="text", text="Lorem ipsum"),
        ]
    )


@pytest.mark.asyncio
async def test_resolve_references_append():
    pipeline_with_refs = PipelineWithRefs(
        steps=[
            DomainStep(domain="source"),
            AppendStepWithRefs(
                pipelines=[
                    Reference(uid="other_pipeline"),
                ]
            ),
            TextStep(new_column="text", text="Lorem ipsum"),
        ]
    )

    assert await pipeline_with_refs.resolve_references(reference_resolver) == PipelineWithVariables(
        steps=[
            DomainStep(domain="source"),
            AppendStepWithRefs(
                pipelines=[
                    PIPELINES_LIBRARY["other_pipeline"],
                ]
            ),
            TextStep(new_column="text", text="Lorem ipsum"),
        ]
    )
