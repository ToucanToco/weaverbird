from typing import Dict, List

from weaverbird.backends.mongo_translator.steps.types import MongoStep
from weaverbird.pipeline.steps import RollupStep


def columnMap(s: List[str]) -> Dict[str, str]:
    return {e: f'${e}' for e in s}


def translate_rollup(step: RollupStep) -> List[MongoStep]:
    facet: Dict[str, List[MongoStep]] = {}
    labelCol = step.label_col or 'label'
    levelCol = step.level_col or 'level'
    parentLabelCol = step.parent_label_col or 'parent'
    addFields = {}

    for idx, elem in enumerate(step.hierarchy):
        id = columnMap(step.hierarchy[: idx + 1] + (step.groupby or []))
        aggs: Dict[str, dict] = {}
        for aggfStep in step.aggregations:
            cols = aggfStep.columns
            newcols = aggfStep.new_columns

            if aggfStep.agg_function == 'count':
                for i in range(len(cols)):
                    # cols and newcols are always of same length
                    aggs[newcols[i]] = {'$sum': 1}
            elif aggfStep.agg_function == 'count distinct':
                # specific step needed to count distinct values
                for i in range(len(cols)):
                    # build a set of unique values
                    aggs[newcols[i]] = {'$addToSet': f'${cols[i]}'}
                    # count the number of items in the set
                    addFields[newcols[i]] = {'$size': f'${newcols[i]}'}
            else:
                for i in range(len(cols)):
                    # cols and newcols are always of same length
                    aggs[newcols[i]] = {f'${aggfStep.agg_function}': f'${cols[i]}'}

        project: dict = {
            '_id': 0,
            **{k: f'$_id.{k}' for k in id.keys()},
            **{k: 1 for k in aggs.keys()},
            labelCol: f'$_id.{elem}',
            levelCol: elem,
        }

        if idx > 0:
            project[parentLabelCol] = f'$_id.{step.hierarchy[idx - 1]}'

        addFieldsToAddToPipeline = [{'$addFields': addFields}] if addFields else []

        facet[f'level_{idx}'] = [
            {
                '$group': {
                    '_id': id,
                    **aggs,
                },
            },
            *addFieldsToAddToPipeline,
            {
                '$project': project,
            },
        ]

    return [
        {'$facet': facet},
        {
            '$project': {
                '_vqbRollupLevels': {
                    '$concatArrays': [f'${k}' for k in sorted(facet.keys())],
                },
            },
        },
        {'$unwind': '$_vqbRollupLevels'},
        {'$replaceRoot': {'newRoot': '$_vqbRollupLevels'}},
    ]
