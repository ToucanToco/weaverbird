import logging

from weaverbird.backends.mongo_translator.steps.types import MongoStep
from weaverbird.backends.mongo_translator.utils import column_to_user_variable
from weaverbird.pipeline import Pipeline, steps
from weaverbird.pipeline.steps import DomainStep, JoinStep

logger = logging.getLogger(__name__)


def translate_join(step: JoinStep) -> list[MongoStep]:
    mongo_pipeline: list[dict] = []
    right = step.right_pipeline
    right_without_domain = Pipeline(steps=[])

    if isinstance(right, str):
        right_domain = DomainStep(name="domain", domain=right)
    else:
        try:
            assert isinstance(right, list)
        except AssertionError:  # in this case right is a Reference
            raise Exception("References must be resolved before translating the pipeline")
        right_domain = DomainStep(**right[0])
        right_without_domain.steps = [
            getattr(steps, f"{s['name'].capitalize()}Step")(**s) for s in right[1:]
        ]

    mongo_let: dict[str, str] = {}
    mongo_expr_and: list[dict[str, list[str]]] = []

    for left_on, right_on in step.on:
        mongo_let[column_to_user_variable(left_on)] = f"${left_on}"
        mongo_expr_and.append({"$eq": [f"${right_on}", f"$${column_to_user_variable(left_on)}"]})

    from weaverbird.backends.mongo_translator.mongo_pipeline_translator import translate_pipeline

    mongo_pipeline.append(
        {
            "$lookup": {
                "from": right_domain.domain,
                "let": mongo_let,
                "pipeline": translate_pipeline(right_without_domain)
                + [{"$match": {"$expr": {"$and": mongo_expr_and}}}],
                "as": "_vqbJoinKey",
            }
        }
    )
    if step.type == "inner":
        mongo_pipeline.append({"$unwind": "$_vqbJoinKey"})
    elif step.type == "left":
        mongo_pipeline.append(
            {"$unwind": {"path": "$_vqbJoinKey", "preserveNullAndEmptyArrays": True}}
        )
    else:
        mongo_pipeline.append({"$match": {"_vqbJoinKey": {"$eq": []}}})
        mongo_pipeline.append(
            {"$unwind": {"path": "$_vqbJoinKey", "preserveNullAndEmptyArrays": True}}
        )

    mongo_pipeline.append(
        {
            "$replaceRoot": {"newRoot": {"$mergeObjects": ["$_vqbJoinKey", "$$ROOT"]}},
        }
    )
    mongo_pipeline.append(
        {
            "$project": {"_vqbJoinKey": 0},
        },
    )
    return mongo_pipeline
