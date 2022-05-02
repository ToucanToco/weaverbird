from typing import List

from weaverbird.backends.mongo_translator.steps.types import MongoStep
from weaverbird.pipeline.steps import RankStep


def translate_rank(step: RankStep) -> List[MongoStep]:
    vqb_var_order: MongoStep = {}

    if step.method == 'dense':
        vqb_var_order = {
            '$cond': [
                {'$ne': [f'$$this.{step.value_col}', '$$value.prevValue']},
                {'$add': ['$$value.order', 1]},
                '$$value.order',
            ],
        }
    else:
        vqb_var_order = {'$add': ['$$value.order', 1]}

    vqb_var_obj: MongoStep = {
        '$let': {
            'vars': {
                'order': vqb_var_order,
                'rank': {
                    '$cond': [
                        {'$ne': [f'$$this.{step.value_col}', '$$value.prevValue']},
                        {'$add': ['$$value.order', 1]},
                        '$$value.prevRank',
                    ],
                },
            },
            'in': {
                'a': {
                    '$concatArrays': [
                        '$$value.a',
                        [
                            {
                                '$mergeObjects': [
                                    '$$this',
                                    {
                                        (
                                            step.new_column_name
                                            if step.new_column_name
                                            else f'{step.value_col}_RANK'
                                        ): '$$rank'
                                    },
                                ],
                            },
                        ],
                    ],
                },
                'order': '$$order',
                'prevValue': f'$$this.{step.value_col}',
                'prevRank': '$$rank',
            },
        },
    }

    ranked_array: MongoStep = {
        '$let': {
            'vars': {
                'reducedArrayInObj': {
                    '$reduce': {
                        'input': '$_vqbArray',
                        'initialValue': {
                            'a': [],
                            'order': 0,
                            'prevValue': None,
                            'prevRank': None,
                        },
                        'in': vqb_var_obj,
                    },
                },
            },
            'in': '$$reducedArrayInObj.a',
        },
    }

    return [
        {'$sort': {(step.value_col): 1 if step.order == 'asc' else -1}},
        {
            '$group': {
                '_id': [[c, f'${c}'] for c in step.groupby] if step.groupby else None,
                '_vqbArray': {'$push': '$$ROOT'},
            },
        },
        {'$project': {'_vqbSortedArray': ranked_array}},
        {'$unwind': '$_vqbSortedArray'},
        {'$replaceRoot': {'newRoot': '$_vqbSortedArray'}},
    ]
