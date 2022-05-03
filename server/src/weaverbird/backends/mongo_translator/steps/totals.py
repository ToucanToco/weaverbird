import itertools
from typing import Dict, List, Tuple

from weaverbird.backends.mongo_translator.steps.types import MongoStep
from weaverbird.pipeline.steps import TotalsStep


def combinations(iterable: list) -> list:
    """combinations([1,2,3]) --> (1,) (2,) (3,) (1,2) (1,3) (2,3) (1,2,3)"""
    return list(
        itertools.chain.from_iterable(
            itertools.combinations(iterable, r) for r in range(1, len(iterable) + 1)
        )
    )


def columnMap(s: List[str]) -> Dict[str, str]:
    return {e: f'${e}' for e in s}


def translate_totals(step: TotalsStep) -> List[MongoStep]:
    facet: Dict[str, List[MongoStep]] = {}
    groups: List[str] = step.groups or []
    addFields: MongoStep = {}
    project: MongoStep = {'_id': 0}  # ensures $project stage will never be empty
    # list of columns to combine
    toCombine: List[str] = [c.total_column for c in step.total_dimensions]
    # get combinations, remove last combo (most granular combination of columns
    # so not useful to compute total rows) and add an empty tuple (to compute the grand total)
    combos: List[Tuple] = combinations(toCombine)[:-1]
    combos.append(tuple())

    for aggfStep in step.aggregations:
        for i in range(len(aggfStep.columns)):
            addFields[aggfStep.new_columns[i]] = f'${aggfStep.columns[i]}'
            if aggfStep.new_columns[i] != aggfStep.columns[i]:
                project[aggfStep.columns[i]] = 0

    facet['originalData'] = [{'$addFields': addFields}, {'$project': project}]

    for i in range(len(combos)):
        comb = combos[i]
        # List of columns that that will be used to group the aggregations computation
        # i.e. we will compute total rows for dimensions not included in this group id
        id = columnMap(list(comb) + list(groups))
        aggs: Dict[str, dict] = {}
        # get columns not in aggregation, i.e. columns that will hold the total rows labels
        totalColumns: List[str] = [e for e in toCombine if e not in comb]
        countDistinctAddFields = {}

        for aggfStep in step.aggregations:
            for j in range(len(aggfStep.columns)):
                valueCol = aggfStep.columns[j]
                aggregatedCol = aggfStep.new_columns[j]
                aggFunc = aggfStep.agg_function
                if aggFunc == 'count':
                    aggs[aggregatedCol] = {'$sum': 1}
                elif aggFunc == 'count distinct':
                    # build a set of unique values
                    aggs[aggregatedCol] = {'$addToSet': f'${valueCol}'}
                    # count the number of items in the set
                    countDistinctAddFields[aggregatedCol] = {'$size': f'${aggregatedCol}'}
                else:
                    aggs[aggregatedCol] = {f'${aggFunc}': f'${valueCol}'}

        addFieldsToAddToPipeline = (
            [{'$addFields': countDistinctAddFields}] if countDistinctAddFields else []
        )

        facet[f'combo_{i}'] = [
            {
                '$group': {
                    '_id': id,
                    **aggs,
                },
            },
            *addFieldsToAddToPipeline,
            {
                '$project': {
                    '_id': 0,
                    # Return id fields (untouched)
                    **{k: f'$_id.{k}' for k in id.keys()},
                    # Return computed aggregation fields
                    **{k: 1 for k in aggs.keys()},
                    # Project the label of total rows for those columns
                    **{
                        dimension.total_column: dimension.total_rows_label
                        for dimension in step.total_dimensions
                        if dimension.total_column in totalColumns
                    },
                },
            },
        ]

    return [
        {'$facet': facet},
        {
            '$project': {
                '_vqbCombos': {'$concatArrays': [f'${k}' for k in facet]},
            },
        },
        {'$unwind': '$_vqbCombos'},
        {'$replaceRoot': {'newRoot': '$_vqbCombos'}},
    ]
