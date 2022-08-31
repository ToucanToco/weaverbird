from weaverbird.backends.mongo_translator.steps.types import MongoStep
from weaverbird.pipeline.steps import ConcatenateStep


def _convert_to_type(input: str | dict, type_: str) -> dict[str, str | dict]:
    return {"$convert": {"input": input, "to": type_}}


def translate_concatenate(step: ConcatenateStep) -> list[MongoStep]:
    # NOTE: Translated from "../src/lib/translators/mongo.ts"'s
    # concatenate() step. The difference is that we're using mongo's
    # $convert operator here, which requires mongo>=4.0
    concat_block: list[dict | str] = [_convert_to_type(f"${step.columns[0]}", "string")]
    for col in step.columns[1:]:
        concat_block += [step.separator, _convert_to_type(f"${col}", "string")]

    return [{"$addFields": {step.new_column_name: {"$concat": concat_block}}}]
