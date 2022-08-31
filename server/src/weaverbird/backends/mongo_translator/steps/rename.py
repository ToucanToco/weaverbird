from weaverbird.backends.mongo_translator.steps.types import MongoStep
from weaverbird.pipeline.steps import RenameStep


def translate_rename(step: RenameStep) -> list[MongoStep]:
    return [
        {"$addFields": {to_rename[1]: f"${to_rename[0]}" for to_rename in step.to_rename}},
        {
            "$project": {
                to_rename[0]: 0
                for to_rename in step.to_rename
                if to_rename[0] not in [to_rename[1] for to_rename in step.to_rename]
            }
        },
    ]
