from weaverbird.backends.mongo_translator.steps.types import MongoStep
from weaverbird.pipeline.steps import UppercaseStep


# NOTE: Executing javascript is not very performant, however the native $toUpper function does
# not support accents
def translate_uppercase(step: UppercaseStep) -> list[MongoStep]:
    return [
        {
            "$addFields": {
                step.column: {
                    "$function": {
                        "body": "function(elem) { return typeof elem === 'string' ? elem.toUpperCase() : elem; }",
                        "args": [f"${step.column}"],
                        "lang": "js",
                    }
                }
            }
        }
    ]
