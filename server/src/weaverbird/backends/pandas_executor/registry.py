from typing import Callable

from weaverbird.utils.step_registry import REGISTRY, BackendStepRegistry


def pandas_registry() -> BackendStepRegistry:
    return REGISTRY.registry("pandas")


def register(*args, **kwargs) -> Callable:
    called_with_kwargs = bool(kwargs)
    step_name = kwargs.pop('step_name', None) or args[0].__name__.replace('execute_', '')
    if called_with_kwargs:
        return pandas_registry().register(*args, step_name=step_name, **kwargs)
    else:
        return pandas_registry().register(step_name=step_name, **kwargs)(*args)
