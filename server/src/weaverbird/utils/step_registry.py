import inspect
from typing import Callable, Optional, get_args

from pydantic import BaseModel

from weaverbird.pipeline import PipelineStep
from weaverbird.pipeline.steps.utils.base import BaseStep


class RegistryError(Exception):
    """Base Exception for all registry errors"""


class ImplementationAlreadyExists(RegistryError):
    """Implementation for step already exists"""


class NoImplementationFound(RegistryError):
    """Implementation for step found"""


class NoSuchRegistry(RegistryError):
    """Registry does no exist"""


class RegistryAlreadyExists(RegistryError):
    """Registry already exists"""


class NoSuchStepModel(RegistryError):
    """No step model found"""


# Listing all existing steps and their models
_ALL_EXISTING_STEPS: dict[str, type[PipelineStep]] = {
    klass.__name__: klass for klass in get_args(get_args(PipelineStep)[0])
}


def _get_step_by_class_name(name: str) -> type[PipelineStep]:
    """Returns a step class given its name. Useful for mypy string annotations"""
    if name not in _ALL_EXISTING_STEPS:
        raise NoSuchStepModel(f"No step model found for '{name}'")
    return _ALL_EXISTING_STEPS[name]


class BackendStepMetadata(BaseModel):
    """Metadata for a step implementation for a given backend"""

    step_model: type[PipelineStep]
    step_name: str
    # Minimum target version required for the step, as as tuple of integers. For example v.1.23.4
    # would be (1, 23, 4)
    minimum_target_version: tuple[int, ...] | None = None
    # The actual implementation
    fn: Callable


class BackendStepRegistry:
    """A registry of steps supported by a given backend.

    This class should not be constructed manually. Instead, use REGISTRY.registry('my registry'),
    to ensure you'll always get the same instance.
    """

    def __init__(
        self,
        backend_name: str,
        *,
        parent: Optional['BackendStepRegistry'] = None,
        minimum_target_version: tuple[int, ...] | None = None,
    ) -> None:
        """
        :param backend_name: The name of the translation/execution backend this registry is for
        :param parent: An optional parent registry. This is useful for backends with several
                       implementations.
        :param minimum_target_version: In case all steps for the backend have a minimum required
                                       version, it can be passed to the registry directly (the
                                       version can still be overriden at step-level)
        """
        self._backend_name = backend_name
        self._supported_steps: dict[str, BackendStepMetadata] = {}
        self._parent = parent
        self._minimum_target_version = minimum_target_version

    def _set_step(self, meta: BackendStepMetadata) -> BackendStepMetadata:
        self._supported_steps[meta.step_name] = meta
        return meta

    @staticmethod
    def _get_step_model(step_param: str | type) -> type[PipelineStep]:
        if isinstance(step_param, str):
            return _get_step_by_class_name(step_param)
        if issubclass(step_param, BaseStep):
            return step_param  # type: ignore
        raise NoSuchStepModel(f"Could not find step model for {step_param}")

    @classmethod
    def _get_step_model_from_callable(cls, fn: Callable) -> type[PipelineStep]:
        signature = inspect.signature(fn)
        if 'step' in signature.parameters:
            return cls._get_step_model(signature.parameters['step'].annotation)
        # no parameter named 'step', trying to find one that works
        for param in signature.parameters.values():
            try:
                return cls._get_step_model(param.annotation)
            except NoSuchStepModel:
                continue
        raise NoSuchStepModel(
            'Could not find step model for function. Please specify '
            f'the model manually. Signature: {signature}'
        )

    def _register(
        self,
        fn: Callable,
        *,
        step_name: str | None = None,
        step_model: str | type[PipelineStep] | None = None,
        minimum_target_version: tuple[int, ...] | None = None,
    ) -> Callable:
        """Registers a step for the registry.

        It is not intended to be used directly. Instead, use the @register decorator.

        Raises an exception in case the step is already registered.

        :param step_name: The step's name. Defaults to the function's name.
        :param step_model: The step's pydantic model. If not specified, the type annotation of the
                           'step' parameter of the callable will be used. If no 'step' parameter is
                           available, the type annotation of the first parameter receiving a
                           PipelineStep is used.
        """
        step_name = step_name or fn.__name__
        step_model = step_model or self._get_step_model_from_callable(fn)
        if step_name in (supported_steps := self.supported_steps()):
            raise ImplementationAlreadyExists(
                (
                    f"[{self._backend_name}] Implementation already exists for step '{step_name}'"
                    + f": {supported_steps[step_name]}"
                )
            )
        return self._set_step(
            BackendStepMetadata(
                fn=fn,
                step_name=step_name,
                step_model=step_model,
                minimum_target_version=minimum_target_version or self._minimum_target_version,
            )
        ).fn

    def register(self, *args, **kwargs) -> Callable:
        """Decorator allowing to register a step.

        Usage:

        # Registers the step under the name 'mystep'
        @register
        def mystep(step: MyStep, ...):
            ...

        # Register the step under the name 'mystep', with a minimum target version of 1.23.45
        @register(step_name='mystep', minimum_target_version=(1, 23, 45))
        def translate_mystep(step: MyStep, ...):
            ...

        See _register for supported parameters.
        """
        if kwargs:

            def dec(fn: Callable):
                return self._register(fn, **kwargs)

            return dec

        return self._register(*args)

    def _override(
        self,
        fn: Callable,
        *,
        step_name: str | None = None,
        step_model: str | type[PipelineStep] | None = None,
        minimum_target_version: tuple[int, ...] | None = None,
    ) -> Callable:
        """Overrides a step for the registry.

        It is not intended to be used directly. Instead, use the @override decorator.

        Raises an exception in case the step is not registered. Raise an exception in case the step
        is not registered.

        See _register for argument usage
        """
        step_name = step_name or fn.__name__
        step_model = step_model or self._get_step_model_from_callable(fn)
        if step_name not in self.supported_steps():
            raise NoImplementationFound(
                f"[{self._backend_name}] No implementation found for step '{step_name}'"
            )
        return self._set_step(
            BackendStepMetadata(
                fn=fn,
                step_name=step_name,
                step_model=step_model,
                minimum_target_version=minimum_target_version or self._minimum_target_version,
            )
        ).fn

    def override(self, *args, **kwargs) -> Callable:
        """Decorator allowing to override a registered step.

        Supports the same parameters as register()
        """
        if kwargs:

            def dec(fn: Callable):
                return self._override(fn, **kwargs)

            return dec

        return self._override(*args)

    def supported_steps(self) -> dict[str, BackendStepMetadata]:
        """Returns metadata for all steps supported by this registry"""
        return (
            {**self._supported_steps}
            if self._parent is None
            else {**self._parent.supported_steps(), **self._supported_steps}
        )

    def child(
        self, child_name: str, minimum_target_version: tuple[int, ...] | None = None
    ) -> 'BackendStepRegistry':
        """Creates a child registry for this registry."""
        name = f"{self._backend_name}-{child_name}"
        registry = BackendStepRegistry(
            name, parent=self, minimum_target_version=minimum_target_version
        )
        REGISTRY.add(name, registry)
        return registry


class StepRegistry:
    def __init__(self) -> None:
        self._registries: dict[str, BackendStepRegistry] = {}

    def add(self, registry_name: str, registry: BackendStepRegistry) -> BackendStepRegistry:
        if registry_name in self._registries:
            raise RegistryAlreadyExists(f'Registry {registry_name} already exists')
        self._registries[registry_name] = registry
        return registry

    def registry(self, registry_name: str) -> BackendStepRegistry:
        if registry_name not in self._registries:
            self.add(registry_name, BackendStepRegistry(registry_name))
        return self._registries[registry_name]

    def supported_steps(self, registry_name: str) -> dict[str, BackendStepMetadata]:
        if registry_name not in self._registries:
            raise NoSuchRegistry(f"No such registry: '{registry_name}'")
        return self._registries[registry_name].supported_steps()


REGISTRY = StepRegistry()
