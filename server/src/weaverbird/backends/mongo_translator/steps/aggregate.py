from typing import Any

from weaverbird.backends.mongo_translator.steps.types import MongoStep
from weaverbird.pipeline.steps import AggregateStep


def translate_aggregate(step: AggregateStep) -> list[MongoStep]:
    idblock = {col: f"${col}" for col in step.on}
    group: dict[str, dict] = {}
    project: dict[str, Any] = {}
    add_fields = {}
    group["_id"] = idblock

    for agg_f_step in step.aggregations:
        cols = agg_f_step.columns
        new_cols = agg_f_step.new_columns

        # There is no `$count` operator in Mongo, we have to `$sum` 1s to get
        # an equivalent result
        if agg_f_step.agg_function == "count":
            for i in range(len(cols)):
                group[new_cols[i]] = {"$sum": 1}
        elif agg_f_step.agg_function == "count distinct":
            for i in range(len(cols)):
                group[new_cols[i]] = {"$addToSet": f"${cols[i]}"}
                add_fields[new_cols[i]] = {"$size": f"${new_cols[i]}"}
        else:
            for i in range(len(cols)):
                group[new_cols[i]] = {f"${agg_f_step.agg_function}": f"${cols[i]}"}

    add_fields_to_add_to_pipeline = [{"$addFields": add_fields}] if len(add_fields) else []
    if step.keep_original_granularity:
        group["_vqbDocsArray"] = {"$push": "$$ROOT"}
        return [
            {"$group": group},
            *add_fields_to_add_to_pipeline,
            {"$unwind": "$_vqbDocsArray"},
            {"$replaceRoot": {"newRoot": {"$mergeObjects": ["$_vqbDocsArray", "$$ROOT"]}}},
            {"$project": {"_vqbDocsArray": 0}},
            {"$sort": {"_id": 1}},
        ]
    else:
        for group_key in group.keys():
            if group_key == "_id":
                for id_key in group[group_key]:
                    project[id_key] = f"$_id.{id_key}"
            else:
                project[group_key] = 1
        return [
            {"$group": group},
            *add_fields_to_add_to_pipeline,
            {"$project": project},
            {"$sort": {"_id": 1}},
        ]
