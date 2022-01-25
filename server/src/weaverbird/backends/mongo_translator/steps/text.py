from weaverbird.pipeline.steps import TextStep


def translate_text(step: TextStep) -> list:
    return [
        {
            '$addFields': {step.new_column: {'$literal': step.text}},
        }
    ]
