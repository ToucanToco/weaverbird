from weaverbird.backends.mongo_translator.mongo_pipeline_translator import translate_pipeline
from weaverbird.backends.mongo_translator.utils import column_to_user_variable
from weaverbird.exceptions import UnresolvedReferenceError
from weaverbird.pipeline.steps import DomainStep, JoinStep
from weaverbird.pipeline.steps.utils.combination import Reference


def is_reference_to_other_pipeline(pipeline_or_reference: Reference):
    return isinstance(pipeline_or_reference, str)


def is_reference_to_external_query(pipeline_or_reference: Reference):
    return pipeline_or_reference.type == 'ref'


def is_reference(pipeline_or_reference: Reference):
    return is_reference_to_other_pipeline(pipeline_or_reference) or is_reference_to_external_query(
        pipeline_or_reference
    )


def translate_join(step: JoinStep) -> list:
    mongo_pipeline = []
    right = step.right_pipeline

    if is_reference(right):
        raise UnresolvedReferenceError(
            'References must be resolved before translating the pipeline'
        )
    right_domain = DomainStep(**right[0])

    if is_reference_to_external_query(right_domain.domain):
        raise UnresolvedReferenceError(
            'References must be resolved before translating the pipeline'
        )

    right_without_domain = right[1:]
    mongo_let: dict[str, str] = {}
    mongo_expr_and: list[dict[str, list[str]]] = []

    for left_on, right_on in step.on:
        mongo_let[column_to_user_variable(left_on)] = f'${left_on}'
        mongo_expr_and.append({'$eq': [f'${right_on}', f'$(${column_to_user_variable(left_on)})']})

    mongo_pipeline.append(
        {
            '$lookup': {
                'from': right_domain.domain,
                'let': mongo_let,
                'pipeline': [
                    translate_pipeline(right_without_domain),
                    {'$match': {'$expr': {'$and': mongo_expr_and}}},
                ],
                'as': '_vqbJoinKey',
            }
        }
    )

    if step.type == 'inner':
        mongo_pipeline.append(
            {'$unwind': {'path': '$_vqbJoinKey', 'preserveNullAndEmptyArrays': True}}
        )
    else:
        mongo_pipeline.append({'$match': {'_vqbJoinKey': {'$eq': []}}})
        mongo_pipeline.append(
            {'$unwind': {'path': '$_vqbJoinKey', 'preserveNullAndEmptyArrays': True}}
        )

    mongo_pipeline.append(
        {
            '$replaceRoot': {'newRoot': {'$mergeObjects': ['$_vqbJoinKey', '$$ROOT']}},
        }
    )
    mongo_pipeline.append(
        {
            '$project': {'_vqbJoinKey': 0},
        },
    )
    return mongo_pipeline
