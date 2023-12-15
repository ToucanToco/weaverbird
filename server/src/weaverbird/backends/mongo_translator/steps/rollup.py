from weaverbird.backends.mongo_translator.steps.types import MongoStep
from weaverbird.pipeline.steps import RollupStep

_ID_COLUMN = "_id"
_NEW_ID_COLUMN = "__id"


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
            # _id is a name reserved by mongo. If for some reason, a user wants to aggregate the _id
            # column, the aggregation result will be stored in a new __id column
            new_cols = [col if col != _ID_COLUMN else _NEW_ID_COLUMN for col in agg_step.new_columns]

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
            _ID_COLUMN: 0,
            **{k: f"${_ID_COLUMN}.{k}" for k in id.keys()},
            **{k: 1 for k in aggs.keys()},
            label_col: f"${_ID_COLUMN}.{elem}",
            level_col: elem,
        }

        if idx > 0:
            project[parent_label_col] = f"${_ID_COLUMN}.{step.hierarchy[idx - 1]}"

        add_fields_to_add_to_pipeline = [{"$addFields": add_fields}] if add_fields else []

        facet[f"level_{idx}"] = [
            {
                "$group": {
                    _ID_COLUMN: id,
                    **aggs,
                },
            },
            *add_fields_to_add_to_pipeline,
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
