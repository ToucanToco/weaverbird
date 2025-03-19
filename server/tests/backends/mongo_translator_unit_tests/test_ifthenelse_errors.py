import pytest

from weaverbird.backends.mongo_translator.mongo_pipeline_translator import (
    PipelineTranslationFailure,
    translate_pipeline,
)
from weaverbird.pipeline import PipelineWithVariables
from weaverbird.utils.toucan_connectors import nosql_apply_parameters_to_query_with_errors


def test_mongo_translator_ifthenelse_error(available_variables):
    # create query
    steps = [
        {
            "name": "ifthenelse",
            "newColumn": "COND",
            "if": {"column": "FAMILY OWNED", "value": "Y", "operator": "eq"},
            "then": "FAMILY OWNED",  # should be '[FAMILY OWNED]' for column or '"FAMILY OWNED"' for string
            "else": {
                "if": {"column": "BUSINESS OWNED", "value": "Y", "operator": "eq"},
                "then": "'BUSINESS OWNED'",
                "else": {
                    "if": {"column": "STATE OWNED", "value": "Y", "operator": "eq"},
                    "then": "'STATE OWNED'",
                    "else": "'N/A'",
                },
            },
        }
    ]
    pipeline = PipelineWithVariables(steps=steps).render(
        available_variables, nosql_apply_parameters_to_query_with_errors
    )

    with pytest.raises(PipelineTranslationFailure):
        translate_pipeline(pipeline)
