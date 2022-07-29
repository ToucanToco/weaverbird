from weaverbird.utils.step_registry import REGISTRY, BackendStepRegistry


def pypika_registry() -> BackendStepRegistry:
    return REGISTRY.registry("pypika")
