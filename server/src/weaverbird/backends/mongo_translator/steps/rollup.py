from weaverbird.backends.mongo_translator.steps.types import MongoStep
from weaverbird.pipeline.steps import RollupStep


def column_map(s: list[str]) -> dict[str, str]:
    return {e: f"${e}" for e in s}


def translate_rollup(step: RollupStep) -> list[MongoStep]:
    facet: dict[str, list[MongoStep]] = {}
    label_col = step.label_col or "label"
    level_col = step.level_col or "level"
    parent_label_col = step.parent_label_col or "parent"
    add_fields = {}

    for idx, elem in enumerate(step.hierarchy):
        id = column_map(step.hierarchy[: idx + 1] + (step.groupby or []))
        aggs: dict[str, dict] = {}
        for agg_step in step.aggregations:
            cols = agg_step.columns
            new_cols = agg_step.new_columns

            if agg_step.agg_function == "count":
                for i in range(len(cols)):
                    # cols and new_cols are always of same length
                    aggs[new_cols[i]] = {"$sum": 1}
            elif agg_step.agg_function == "count distinct":
                # specific step needed to count distinct values
                for i in range(len(cols)):
                    # build a set of unique values
                    aggs[new_cols[i]] = {"$addToSet": f"${cols[i]}"}
                    # count the number of items in the set
                    add_fields[new_cols[i]] = {"$size": f"${new_cols[i]}"}
            else:
                for i in range(len(cols)):
                    # cols and new_cols are always of same length
                    aggs[new_cols[i]] = {f"${agg_step.agg_function}": f"${cols[i]}"}

        project: dict = {
            "_id": 0,
            **{k: f"$_id.{k}" for k in id.keys()},
            **{k: 1 for k in aggs.keys()},
            label_col: f"$_id.{elem}",
            level_col: elem,
        }

        if idx > 0:
            project[parent_label_col] = f"$_id.{step.hierarchy[idx - 1]}"

        addFieldsToAddToPipeline = [{"$addFields": add_fields}] if add_fields else []

        facet[f"level_{idx}"] = [
            {
                "$group": {
                    "_id": id,
                    **aggs,
                },
            },
            *addFieldsToAddToPipeline,
            {
                "$project": project,
            },
        ]

    return [
        {"$facet": facet},
        {
            "$project": {
                "_vqbRollupLevels": {
                    "$concatArrays": [f"${k}" for k in sorted(facet.keys())],
                },
            },
        },
        {"$unwind": "$_vqbRollupLevels"},
        {"$replaceRoot": {"newRoot": "$_vqbRollupLevels"}},
    ]
