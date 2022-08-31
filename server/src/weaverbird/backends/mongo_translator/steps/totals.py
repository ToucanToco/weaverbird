import itertools

from weaverbird.backends.mongo_translator.steps.types import MongoStep
from weaverbird.pipeline.steps import TotalsStep


def combinations(iterable: list) -> list:
    """combinations([1,2,3]) --> (1,) (2,) (3,) (1,2) (1,3) (2,3) (1,2,3)"""
    return list(
        itertools.chain.from_iterable(
            itertools.combinations(iterable, r) for r in range(1, len(iterable) + 1)
        )
    )


def column_map(s: list[str]) -> dict[str, str]:
    return {e: f"${e}" for e in s}


def translate_totals(step: TotalsStep) -> list[MongoStep]:
    facet: dict[str, list[MongoStep]] = {}
    groups: list[str] = step.groups or []
    add_fields: MongoStep = {}
    project: MongoStep = {"_id": 0}  # ensures $project stage will never be empty
    # list of columns to combine
    to_combine: list[str] = [c.total_column for c in step.total_dimensions]
    # get combinations, remove last combo (most granular combination of columns
    # so not useful to compute total rows) and add an empty tuple (to compute the grand total)
    combos: list[tuple] = combinations(to_combine)[:-1]
    combos.append(tuple())

    for agg_step in step.aggregations:
        for i in range(len(agg_step.columns)):
            add_fields[agg_step.new_columns[i]] = f"${agg_step.columns[i]}"
            if agg_step.new_columns[i] != agg_step.columns[i]:
                project[agg_step.columns[i]] = 0

    facet["originalData"] = [{"$addFields": add_fields}, {"$project": project}]

    for i in range(len(combos)):
        comb = combos[i]
        # List of columns that that will be used to group the aggregations computation
        # i.e. we will compute total rows for dimensions not included in this group id
        id = column_map(list(comb) + list(groups))
        aggs: dict[str, dict] = {}
        # get columns not in aggregation, i.e. columns that will hold the total rows labels
        total_columns: list[str] = [e for e in to_combine if e not in comb]
        count_distinct_add_fields = {}

        for agg_step in step.aggregations:
            for j in range(len(agg_step.columns)):
                value_col = agg_step.columns[j]
                aggregated_col = agg_step.new_columns[j]
                agg_func = agg_step.agg_function
                if agg_func == "count":
                    aggs[aggregated_col] = {"$sum": 1}
                elif agg_func == "count distinct":
                    # build a set of unique values
                    aggs[aggregated_col] = {"$addToSet": f"${value_col}"}
                    # count the number of items in the set
                    count_distinct_add_fields[aggregated_col] = {"$size": f"${aggregated_col}"}
                else:
                    aggs[aggregated_col] = {f"${agg_func}": f"${value_col}"}

        add_fields_to_add_to_pipeline = (
            [{"$addFields": count_distinct_add_fields}] if count_distinct_add_fields else []
        )

        facet[f"combo_{i}"] = [
            {
                "$group": {
                    "_id": id,
                    **aggs,
                },
            },
            *add_fields_to_add_to_pipeline,
            {
                "$project": {
                    "_id": 0,
                    # Return id fields (untouched)
                    **{k: f"$_id.{k}" for k in id.keys()},
                    # Return computed aggregation fields
                    **{k: 1 for k in aggs.keys()},
                    # Project the label of total rows for those columns
                    **{
                        dimension.total_column: dimension.total_rows_label
                        for dimension in step.total_dimensions
                        if dimension.total_column in total_columns
                    },
                },
            },
        ]

    return [
        {"$facet": facet},
        {
            "$project": {
                "_vqbCombos": {"$concatArrays": [f"${k}" for k in facet]},
            },
        },
        {"$unwind": "$_vqbCombos"},
        {"$replaceRoot": {"newRoot": "$_vqbCombos"}},
    ]
