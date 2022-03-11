from typing import List

from weaverbird.pipeline.steps import RenameStep


def translate_rename(step: RenameStep) -> List:
    return [
        {'$addFields': {renaming[1]: f'${renaming[0]}'} for renaming in step.to_rename},
        {'$project': {renaming[0]: 0} for renaming in step.to_rename},
    ]
