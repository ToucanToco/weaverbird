from typing import Generator

import pytest

from weaverbird.pipeline.steps import AbsoluteValueStep, AppendStep
from weaverbird.utils import step_registry


@pytest.fixture
def registry() -> Generator[step_registry.BackendStepRegistry, None, None]:
    yield step_registry.REGISTRY.registry('test')
    # Resetting
    step_registry.REGISTRY._registries = {}


def test_simple_registration(registry: step_registry.BackendStepRegistry):
    @registry.register
    def one(step: AbsoluteValueStep):
        ...

    # Using REGISTRY.registry to ensure we have the same instance
    @step_registry.REGISTRY.registry('test').register(
        step_name='two', minimum_target_version=(1, 2)
    )
    def step_two(step_param: 'AppendStep'):
        ...

    assert registry.supported_steps() == {
        'one': step_registry.BackendStepMetadata(
            step_name='one', step_model=AbsoluteValueStep, fn=one
        ),
        'two': step_registry.BackendStepMetadata(
            step_name='two', step_model=AppendStep, fn=step_two, minimum_target_version=(1, 2)
        ),
    }


def test_override(registry: step_registry.BackendStepRegistry):
    @registry.register
    def one(step: AbsoluteValueStep):
        ...

    assert registry.supported_steps() == {
        'one': step_registry.BackendStepMetadata(
            step_name='one', step_model=AbsoluteValueStep, fn=one
        )
    }

    # Using REGISTRY.registry to ensure we have the same instance
    @step_registry.REGISTRY.registry('test').override(
        step_name='one', minimum_target_version=(1, 2)
    )
    def step_two(step_param: 'AppendStep'):
        ...

    assert registry.supported_steps() == {
        'one': step_registry.BackendStepMetadata(
            step_name='one', step_model=AppendStep, fn=step_two, minimum_target_version=(1, 2)
        ),
    }

    # Overriding again
    registry.override(one)

    assert registry.supported_steps() == {
        'one': step_registry.BackendStepMetadata(
            step_name='one', step_model=AbsoluteValueStep, fn=one
        )
    }


def test_child_registry(registry: step_registry.BackendStepRegistry):
    @registry.register
    def one(step: AbsoluteValueStep):
        ...

    child_reg = registry.child('child')
    assert child_reg._backend_name == 'test-child'

    @child_reg.register
    def two(step: AppendStep):
        ...

    @child_reg.override(step_name='one')
    def three(step: AppendStep):
        ...

    # Parent should have only 'one', and it should not be overriden
    assert registry.supported_steps() == {
        'one': step_registry.BackendStepMetadata(
            step_name='one', step_model=AbsoluteValueStep, fn=one
        )
    }

    # Child should have 'one' and 'two', and 'one' should be overriden
    assert child_reg.supported_steps() == {
        'one': step_registry.BackendStepMetadata(step_name='one', step_model=AppendStep, fn=three),
        'two': step_registry.BackendStepMetadata(step_name='two', step_model=AppendStep, fn=two),
    }


def test_registration_conflict(registry: step_registry.BackendStepRegistry):
    @registry.register
    def one(step: AbsoluteValueStep):
        ...

    with pytest.raises(step_registry.ImplementationAlreadyExists):

        @registry.register(step_name='one')
        def _one(step: AbsoluteValueStep):
            ...

    child_reg = registry.child('child')
    with pytest.raises(step_registry.ImplementationAlreadyExists):

        @child_reg.register(step_name='one')
        def _one_(step: AbsoluteValueStep):
            ...
