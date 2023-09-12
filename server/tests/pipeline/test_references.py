import pytest
from weaverbird.pipeline.pipeline import (
    Pipeline,
    PipelineWithRefs,
    PipelineWithVariables,
    ReferenceUnresolved,
)
from weaverbird.pipeline.steps import (
    AppendStepWithRefs,
    DomainStep,
    DomainStepWithRef,
    JoinStepWithRef,
    TextStep,
)
from weaverbird.pipeline.steps.append import AppendStepWithVariable
from weaverbird.pipeline.steps.join import JoinStepWithVariable
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
    "pipeline_with_unresolved_ref": PipelineWithRefs(
        steps=[
            DomainStepWithRef(domain=Reference(uid="unresolved")),
            TextStep(new_column="fail", text="yes"),
        ]
    ).dict()["steps"],
}


async def reference_resolver(ref: Reference) -> list[dict] | None:
    return PIPELINES_LIBRARY.get(ref.uid)


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

    expected = PipelineWithVariables(
        steps=[
            DomainStep(domain="source"),
            JoinStepWithVariable(
                on=[("key_left", "key_right")],
                right_pipeline=PIPELINES_LIBRARY["other_pipeline"],
                type="left",
            ),
            TextStep(new_column="text", text="Lorem ipsum"),
        ]
    )

    assert await pipeline_with_refs.resolve_references(reference_resolver) == expected


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

    expected = PipelineWithVariables(
        steps=[
            DomainStep(domain="source"),
            AppendStepWithVariable(pipelines=[PIPELINES_LIBRARY["other_pipeline"]]),
            TextStep(new_column="text", text="Lorem ipsum"),
        ]
    )

    assert await pipeline_with_refs.resolve_references(reference_resolver) == expected


@pytest.mark.asyncio
async def test_resolve_references_unresolved_append():
    """
    It should skip pipelines that are not resolved in an append step
    """
    pipeline_with_refs = PipelineWithRefs(
        steps=[
            DomainStep(domain="source"),
            AppendStepWithRefs(
                pipelines=[
                    Reference(uid="unresolved"),
                    Reference(uid="other_pipeline"),
                    Reference(uid="unresolved_2"),
                ]
            ),
            TextStep(new_column="text", text="Lorem ipsum"),
        ]
    )

    expected = PipelineWithVariables(
        steps=[
            DomainStep(domain="source"),
            AppendStepWithVariable(pipelines=[PIPELINES_LIBRARY["other_pipeline"]]),
            TextStep(new_column="text", text="Lorem ipsum"),
        ]
    )
    assert await pipeline_with_refs.resolve_references(reference_resolver) == expected


@pytest.mark.asyncio
async def test_resolve_references_unresolved_append_all():
    """
    It should skip the append step if all its pipelines are not resolved
    """
    pipeline_with_refs = PipelineWithRefs(
        steps=[
            DomainStep(domain="source"),
            AppendStepWithRefs(
                pipelines=[
                    Reference(uid="unresolved"),
                    Reference(uid="unresolved_2"),
                ]
            ),
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
async def test_resolve_references_unresolved_domain():
    """
    It should raise an error if the domain reference is not resolved
    """
    pipeline_with_refs = PipelineWithRefs(
        steps=[
            DomainStepWithRef(domain=Reference(uid="unresolved")),
            TextStep(new_column="text", text="Lorem ipsum"),
        ]
    )
    with pytest.raises(ReferenceUnresolved):
        await pipeline_with_refs.resolve_references(reference_resolver)


@pytest.mark.asyncio
async def test_resolve_references_unresolved_append_subpipeline_error():
    """
    It should skip pipelines that trigger a resolution error
    """
    pipeline_with_refs = PipelineWithRefs(
        steps=[
            DomainStep(domain="source"),
            AppendStepWithRefs(
                pipelines=[
                    Reference(uid="pipeline_with_unresolved_ref"),
                    Reference(uid="other_pipeline"),
                ]
            ),
            TextStep(new_column="text", text="Lorem ipsum"),
        ]
    )

    expected = PipelineWithVariables(
        steps=[
            DomainStep(domain="source"),
            AppendStepWithVariable(pipelines=[PIPELINES_LIBRARY["other_pipeline"]]),
            TextStep(new_column="text", text="Lorem ipsum"),
        ]
    )

    assert await pipeline_with_refs.resolve_references(reference_resolver) == expected


@pytest.mark.asyncio
async def test_resolve_references_unresolved_join():
    """
    It should raise an error if the joined pipeline is not resolved
    """
    pipeline_with_refs = PipelineWithRefs(
        steps=[
            DomainStepWithRef(domain="source"),
            JoinStepWithRef(
                on=[("key_left", "key_right")],
                right_pipeline=Reference(uid="unresolved"),
                type="left",
            ),
            TextStep(new_column="text", text="Lorem ipsum"),
        ]
    )
    with pytest.raises(ReferenceUnresolved):
        assert await pipeline_with_refs.resolve_references(reference_resolver)


@pytest.mark.asyncio
async def test_resolve_references_unresolved_join_subpipeline_error():
    """
    It should raise an error if the joined pipeline raises a resolution error
    """
    pipeline_with_refs = PipelineWithRefs(
        steps=[
            DomainStepWithRef(domain="source"),
            JoinStepWithRef(
                on=[("key_left", "key_right")],
                right_pipeline=Reference(uid="pipeline_with_unresolved_step"),
                type="left",
            ),
            TextStep(new_column="text", text="Lorem ipsum"),
        ]
    )
    with pytest.raises(ReferenceUnresolved):
        await pipeline_with_refs.resolve_references(reference_resolver)
