from typing import Any

import pytest
from pydantic import ValidationError
from weaverbird.pipeline.steps import AppendStep, AppendStepWithRefs


@pytest.fixture
def raw_append_step() -> dict[str, Any]:
    return {
        "name": "append",
        "pipelines": [
            [
                {"name": "domain", "domain": "styles"},
                {
                    "name": "join",
                    "type": "inner",
                    "right_pipeline": [
                        {"name": "domain", "domain": "beers"},
                        {"name": "uppercase", "column": "a"},
                        {"name": "uppercase", "column": "b"},
                    ],
                    "on": [("style", "name")],
                },
            ],
            [
                {"name": "domain", "domain": "beers"},
                {"name": "uppercase", "column": "a"},
            ],
        ],
    }


@pytest.fixture
def raw_append_step_with_refs() -> dict[str, Any]:
    return {
        "name": "append",
        "pipelines": [
            [
                {"name": "domain", "domain": "styles"},
                {
                    "name": "join",
                    "type": "inner",
                    "right_pipeline": [
                        {"name": "domain", "domain": "beers"},
                        {"name": "uppercase", "column": "a"},
                        {"name": "uppercase", "column": "b"},
                    ],
                    "on": [("style", "name")],
                },
            ],
            [
                {"name": "domain", "domain": "beers"},
                {"name": "uppercase", "column": "a"},
            ],
            # Refs
            [
                {
                    "name": "append",
                    "pipelines": [
                        [{"name": "domain", "domain": {"type": "ref", "uid": "foo"}}],
                        [
                            {
                                "name": "join",
                                "type": "inner",
                                "right_pipeline": [{"name": "domain", "domain": {"type": "ref", "uid": "bar"}}],
                                "on": [("style", "name")],
                            },
                            {
                                "name": "join",
                                "type": "inner",
                                "right_pipeline": {"type": "ref", "uid": "baz"},
                                "on": [("style", "name")],
                            },
                        ],
                    ],
                }
            ],
        ],
    }


def test_pipelinestep_validation(raw_append_step: dict[str, Any], raw_append_step_with_refs: dict[str, Any]) -> None:
    step = AppendStep(**raw_append_step)
    assert isinstance(step, AppendStep)
    with pytest.raises(ValidationError):
        AppendStep(**raw_append_step_with_refs)


def test_pipelinestepwith_refs_validation(raw_append_step_with_refs: dict[str, Any]) -> None:
    step = AppendStepWithRefs(**raw_append_step_with_refs)
    assert isinstance(step, AppendStepWithRefs)
