from weaverbird.backends.mongo_translator.steps.types import MongoStep
from weaverbird.pipeline.steps import CompareTextStep


def translate_comparetext(step: CompareTextStep) -> list[MongoStep]:
    return [
        {
            "$addFields": {
                (step.new_column_name): {
                    "$cond": [{"$eq": [f"${step.str_col_1}", f"${step.str_col_2}"]}, True, False],
                }
            }
        }
    ]
