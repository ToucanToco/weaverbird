from pandas import DataFrame, concat

from weaverbird.backends.pandas_executor.types import DomainRetriever, PipelineExecutor
from weaverbird.pipeline.steps import AggregateStep, RollupStep

from .aggregate import execute_aggregate


def execute_rollup(
    step: RollupStep,
    df: DataFrame,
    domain_retriever: DomainRetriever = None,
    execute_pipeline: PipelineExecutor = None,
) -> DataFrame:
    label_col = step.label_col or 'label'
    level_col = step.level_col or 'level'
    parent_label_col = step.parent_label_col or 'parent'

    full_current_hierarchy = []
    all_results = []
    previous_level = None

    for current_level in step.hierarchy:
        full_current_hierarchy.append(current_level)
        aggregate_on_cols = (step.groupby or []) + full_current_hierarchy
        results_for_this_level = execute_aggregate(
            AggregateStep(
                name='aggregate',
                on=aggregate_on_cols,
                aggregations=step.aggregations,
                keepOriginalGranularity=False,
            ),
            df,
        )

        results_for_this_level[level_col] = current_level
        results_for_this_level[label_col] = results_for_this_level[current_level]
        if previous_level is not None:
            results_for_this_level[parent_label_col] = results_for_this_level[previous_level]

        all_results.append(results_for_this_level)
        previous_level = current_level

    columns = (
        step.hierarchy[::-1]
        + (step.groupby or [])
        + [label_col, level_col, parent_label_col]
        + sum([agg.new_columns for agg in step.aggregations], start=[])
    )  # type: ignore

    return concat(all_results)[columns]
