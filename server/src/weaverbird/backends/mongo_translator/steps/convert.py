from weaverbird.backends.mongo_translator.steps.types import MongoStep
from weaverbird.pipeline.steps import ConvertStep

TYPE_MAP = {
    "boolean": "bool",
    "date": "date",
    "float": "double",
    "integer": "long",  # better to cast into 64-bit integers. 32-bit integers ('int') cannot be casted to dates
    "text": "string",
}


def translate_convert(step: ConvertStep) -> list[MongoStep]:
    # /!\ we want to get the same results than with the mongo typescript
    # translator, not than with the pandas executor.

    mongo_add_fields = {}
    mongo_type = TYPE_MAP[step.data_type] if step.data_type in TYPE_MAP else ""
    for column in step.columns:
        # Mongo cannot cast integers into date but only long into date, so we
        # manage the cast from int to long when needed.
        _input: dict | str
        if mongo_type == "date":
            _input = {
                "$cond": [
                    {"$eq": [{"$type": f"${column}"}, "int"]},
                    {"$toLong": f"${column}"},
                    f"${column}",
                ]
            }
        else:
            _input = f"${column}"
        mongo_add_fields[column] = {
            "$convert": {
                "input": _input,
                "to": mongo_type,
                "onError": None,  # failed conversions result in null instead of crashing
            }
        }

    return [{"$addFields": mongo_add_fields}]
