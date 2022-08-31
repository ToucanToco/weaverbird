from weaverbird.backends.mongo_translator.steps.types import MongoStep
from weaverbird.pipeline.steps import UniqueGroupsStep


def translate_uniquegroups(step: UniqueGroupsStep) -> list[MongoStep]:
    id_block = {col: f"${col}" for col in step.on}
    project_block = {col: f"$_id.{col}" for col in step.on}
    return [{"$group": {"_id": id_block}}, {"$project": project_block}]
