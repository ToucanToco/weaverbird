from weaverbird.backends.mongo_translator.steps.types import MongoStep
from weaverbird.pipeline.steps import LowercaseStep


# NOTE: Executing javascript is not very performant, however the native $toLower function does
# not support accents
def translate_lowercase(step: LowercaseStep) -> list[MongoStep]:
    return [
        {
            "$addFields": {
                step.column: {
                    "$function": {
                        "body": "function(elem) { return typeof elem === 'string' ? elem.toLowerCase() : elem; }",
                        "args": [f"${step.column}"],
                        "lang": "js",
                    }
                }
            }
        }
    ]
