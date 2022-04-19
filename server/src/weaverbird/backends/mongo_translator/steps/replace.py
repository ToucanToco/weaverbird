from typing import List

from weaverbird.backends.mongo_translator.steps.types import MongoStep
from weaverbird.pipeline.steps import ReplaceStep


def translate_replace(step: ReplaceStep) -> List[MongoStep]:
    return [
        {
            '$addFields': {
                f'{step.search_column}': {
                    '$replaceAll': {
                        'input': f'${step.search_column}',
                        'find': old_value,
                        'replacement': new_value,
                    }
                    for (old_value, new_value) in step.to_replace
                }
            }
        }
    ]
