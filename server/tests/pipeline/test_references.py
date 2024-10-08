import pytest

from weaverbird.pipeline.pipeline import (
    Pipeline,
    PipelineWithVariables,
    ReferenceUnresolved,
)
from weaverbird.pipeline.steps import (
    AppendStep,
    DomainStep,
    FilterStepWithVariables,
    JoinStep,
    TextStep,
    TextStepWithVariable,
)
from weaverbird.pipeline.steps.utils.combination import Reference

PIPELINES_LIBRARY: dict[str, list[dict]] = {
    "source_pipeline": Pipeline(
        steps=[
            DomainStep(domain="source"),
        ]
    ).dict()["steps"],
    "intermediate_pipeline": Pipeline(
        steps=[
            DomainStep(domain=Reference(uid="source_pipeline")),
            TextStep(new_column="meow", text="Cat"),
        ]
    ).dict()["steps"],
    "other_pipeline": Pipeline(
        steps=[
            DomainStep(domain="other_source"),
            TextStep(new_column="comes_from", text="other"),
        ]
    ).dict()["steps"],
    "pipeline_with_unresolved_ref": Pipeline(
        steps=[
            DomainStep(domain=Reference(uid="unresolved")),
            TextStep(new_column="fail", text="yes"),
        ]
    ).dict()["steps"],
}


async def reference_resolver(ref: Reference) -> list[dict] | None:
    return PIPELINES_LIBRARY.get(ref.uid)


@pytest.mark.asyncio
async def test_resolve_references_domain():
    pipeline_with_refs = Pipeline(
        steps=[
            DomainStep(domain=Reference(uid="source_pipeline")),
            TextStep(new_column="text", text="Lorem ipsum"),
        ]
    )
    assert await pipeline_with_refs.resolve_references(reference_resolver) == Pipeline(
        steps=[
            DomainStep(domain="source"),
            TextStep(new_column="text", text="Lorem ipsum"),
        ]
    )


@pytest.mark.asyncio
async def test_resolve_references_recursive():
    pipeline_with_refs = Pipeline(
        steps=[
            DomainStep(domain=Reference(uid="intermediate_pipeline")),
            TextStep(new_column="text", text="Lorem ipsum"),
        ]
    )
    assert await pipeline_with_refs.resolve_references(reference_resolver) == Pipeline(
        steps=[
            DomainStep(domain="source"),
            TextStep(new_column="meow", text="Cat"),
            TextStep(new_column="text", text="Lorem ipsum"),
        ]
    )


@pytest.mark.asyncio
async def test_resolve_references_join():
    pipeline_with_refs = Pipeline(
        steps=[
            DomainStep(domain="source"),
            JoinStep(
                on=[("key_left", "key_right")],
                right_pipeline=Reference(uid="other_pipeline"),
                type="left",
            ),
            TextStep(new_column="text", text="Lorem ipsum"),
        ]
    )

    expected = Pipeline(
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

    assert await pipeline_with_refs.resolve_references(reference_resolver) == expected


@pytest.mark.asyncio
async def test_resolve_references_append():
    pipeline_with_refs = Pipeline(
        steps=[
            DomainStep(domain="source"),
            AppendStep(
                pipelines=[
                    Reference(uid="other_pipeline"),
                ]
            ),
            TextStep(new_column="text", text="Lorem ipsum"),
        ]
    )

    expected = Pipeline(
        steps=[
            DomainStep(domain="source"),
            AppendStep(pipelines=[PIPELINES_LIBRARY["other_pipeline"]]),
            TextStep(new_column="text", text="Lorem ipsum"),
        ]
    )

    assert await pipeline_with_refs.resolve_references(reference_resolver) == expected

    pipeline_with_refs = Pipeline(
        steps=[
            DomainStep(domain="source"),
            AppendStep(
                pipelines=[
                    [
                        DomainStep(domain=Reference(uid="other_pipeline")),
                        TextStep(new_column="text", text="Lorem ipsum"),
                    ],
                ]
            ),
        ]
    )
    expected = Pipeline(
        steps=[
            DomainStep(domain="source"),
            AppendStep(
                pipelines=[[*PIPELINES_LIBRARY["other_pipeline"], TextStep(new_column="text", text="Lorem ipsum")]]
            ),
        ]
    )

    assert await pipeline_with_refs.resolve_references(reference_resolver) == expected


@pytest.mark.asyncio
async def test_resolve_references_unresolved_append():
    """
    It should skip pipelines that are not resolved in an append step
    """
    pipeline_with_refs = Pipeline(
        steps=[
            DomainStep(domain="source"),
            AppendStep(
                pipelines=[
                    Reference(uid="unresolved"),
                    Reference(uid="other_pipeline"),
                    Reference(uid="unresolved_2"),
                ]
            ),
            TextStep(new_column="text", text="Lorem ipsum"),
        ]
    )

    expected = Pipeline(
        steps=[
            DomainStep(domain="source"),
            AppendStep(pipelines=[PIPELINES_LIBRARY["other_pipeline"]]),
            TextStep(new_column="text", text="Lorem ipsum"),
        ]
    )
    assert await pipeline_with_refs.resolve_references(reference_resolver) == expected


@pytest.mark.asyncio
async def test_resolve_references_unresolved_append_all():
    """
    It should skip the append step if all its pipelines are not resolved
    """
    pipeline_with_refs = Pipeline(
        steps=[
            DomainStep(domain="source"),
            AppendStep(
                pipelines=[
                    Reference(uid="unresolved"),
                    Reference(uid="unresolved_2"),
                ]
            ),
            TextStep(new_column="text", text="Lorem ipsum"),
        ]
    )

    assert await pipeline_with_refs.resolve_references(reference_resolver) == Pipeline(
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
    pipeline_with_refs = Pipeline(
        steps=[
            DomainStep(domain=Reference(uid="unresolved")),
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
    pipeline_with_refs = Pipeline(
        steps=[
            DomainStep(domain="source"),
            AppendStep(
                pipelines=[
                    Reference(uid="pipeline_with_unresolved_ref"),
                    Reference(uid="other_pipeline"),
                ]
            ),
            TextStep(new_column="text", text="Lorem ipsum"),
        ]
    )

    expected = Pipeline(
        steps=[
            DomainStep(domain="source"),
            AppendStep(pipelines=[PIPELINES_LIBRARY["other_pipeline"]]),
            TextStep(new_column="text", text="Lorem ipsum"),
        ]
    )

    assert await pipeline_with_refs.resolve_references(reference_resolver) == expected


@pytest.mark.asyncio
async def test_resolve_references_unresolved_join():
    """
    It should raise an error if the joined pipeline is not resolved
    """
    pipeline_with_refs = Pipeline(
        steps=[
            DomainStep(domain="source"),
            JoinStep(
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
    pipeline_with_refs = Pipeline(
        steps=[
            DomainStep(domain="source"),
            JoinStep(
                on=[("key_left", "key_right")],
                right_pipeline=Reference(uid="pipeline_with_unresolved_step"),
                type="left",
            ),
            TextStep(new_column="text", text="Lorem ipsum"),
        ]
    )
    with pytest.raises(ReferenceUnresolved):
        await pipeline_with_refs.resolve_references(reference_resolver)


@pytest.mark.asyncio
async def test_resolve_references_with_variables():
    pipeline_with_refs = PipelineWithVariables(
        steps=[
            DomainStep(domain=Reference(uid="intermediate_pipeline")),
            FilterStepWithVariables(
                condition={
                    "column": "date",
                    "operator": "from",
                    "value": {
                        "quantity": 1,
                        "duration": "year",
                        "operator": "before",
                        "date": "{{ TODAY }}",
                    },
                }
            ),
        ]
    )
    assert await pipeline_with_refs.resolve_references(reference_resolver) == PipelineWithVariables(
        steps=[
            DomainStep(domain="source"),
            TextStepWithVariable(new_column="meow", text="Cat"),
            FilterStepWithVariables(
                condition={
                    "column": "date",
                    "operator": "from",
                    "value": {
                        "quantity": 1,
                        "duration": "year",
                        "operator": "before",
                        "date": "{{ TODAY }}",
                    },
                }
            ),
        ]
    )
