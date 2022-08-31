from weaverbird.backends.mongo_translator.steps.types import MongoStep
from weaverbird.pipeline.steps import SubstringStep


def translate_substring(step: SubstringStep) -> list[MongoStep]:
    pos_start_index = (
        step.start_index - 1
        if step.start_index > 0
        else {"$add": [{"$strLenCP": f"${step.column}"}, step.start_index]}
    )

    pos_end_index = (
        step.end_index - 1
        if step.end_index > 0
        else {"$add": [{"$strLenCP": f"${step.column}"}, step.end_index]}
    )

    length_to_keep = {
        "$add": [
            {
                "$subtract": [pos_end_index, pos_start_index],
            },
            1,
        ],
    }

    substr_mongo = {"$substrCP": [f"${step.column}", pos_start_index, length_to_keep]}

    return [
        {
            "$addFields": {
                (
                    step.new_column_name if step.new_column_name else f"{step.column}_SUBSTR"
                ): substr_mongo
            }
        }
    ]
