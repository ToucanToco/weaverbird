import pandas as pd

from weaverbird.backends.pandas_executor.types import DomainRetriever, PipelineExecutor
from weaverbird.pipeline.steps.dissolve import DissolveStep
from weaverbird.pipeline.steps.hierarchy import HierarchyStep

from .dissolve import execute_dissolve


def _dissolve_one_level(
    df: pd.DataFrame, groups: list[str], level_col: str, level: int
) -> pd.DataFrame:
    dissolved = execute_dissolve(DissolveStep(groups=groups), df)
    dissolved[level_col] = level
    return dissolved


def execute_hierarchy(
    step: HierarchyStep,
    df: pd.DataFrame,
    domain_retriever: DomainRetriever = None,
    execute_pipeline: PipelineExecutor = None,
) -> pd.DataFrame:
    df[step.hierarchy_level_column] = len(step.hierarchy)
    return pd.concat(
        [df]
        + [
            _dissolve_one_level(
                df,
                step.hierarchy[: -idx if idx else None],
                step.hierarchy_level_column,
                len(step.hierarchy) - idx - 1,
            )
            for idx in range(len(step.hierarchy))
        ],
        ignore_index=True,
    )
