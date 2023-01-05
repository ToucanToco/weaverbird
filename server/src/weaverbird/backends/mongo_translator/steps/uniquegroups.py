from weaverbird.backends.mongo_translator.steps.types import MongoStep
from weaverbird.pipeline.steps import UniqueGroupsStep


def translate_uniquegroups(step: UniqueGroupsStep) -> list[MongoStep]:
    id_block = {col: f"${col}" for col in step.on}
    project_block = {col: f"$_id.{col}" for col in step.on}
    # Since $group doesn't preserve order, we need to add an extra column to know in which
    # order arrived the rows, and then sort by it.
    # But we can't use `$documentNumber` with `$setWindowFields`
    # or `$unwind` with `includeArrayIndex`
    # Why? because we would need to group or sort them and
    # we have no way to know in which order they arrived.
    # We hence use a JS function to increment a counter.
    return [
        {
            "$set": {
                "__row_number__": {
                    "$function": {
                        "body": "function() {try {row_number+= 1;} catch (e) {row_number= 0;}return row_number;}",
                        "args": [],
                        "lang": "js",
                    }
                }
            }
        },
        {"$group": {"_id": id_block, "__row_number__": {"$first": "$__row_number__"}}},
        {"$sort": {"__row_number__": 1}},
        {"$project": {"_id": 0, **project_block}},
    ]
