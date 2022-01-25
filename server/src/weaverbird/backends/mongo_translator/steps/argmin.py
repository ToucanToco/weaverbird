from weaverbird.pipeline.steps import ArgminStep


def translate_argmin(step: ArgminStep) -> list:
    return [
        {
            '$group': {
                '_id': {group: f'${group}' for group in step.groups},
                '_vqbAppArray': {'$push': '$$ROOT'},
                '_vqbAppValueToCompare': {'$min': f'${step.column}'},
            }
        },
        {'$unwind': '$_vqbAppArray'},
        {'$replaceRoot': {'newRoot': {'$mergeObjects': ['$_vqbAppArray', '$$ROOT']}}},
        {'$project': {'_vqbAppArray': 0}},
        {
            '$redact': {
                '$cond': [
                    {'$eq': [f'${step.column}', '$_vqbAppValueToCompare']},
                    '$$KEEP',
                    '$$PRUNE',
                ]
            }
        },
        {'$project': {'_vqbAppValueToCompare': 0}},
    ]
