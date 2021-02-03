import glob
import json

import pytest
from toucan_connectors.common import nosql_apply_parameters_to_query

from weaverbird.pipeline import Pipeline, PipelineWithVariables


def get_test_cases():
    test_cases = []
    globs = glob.glob('./tests/fixtures/fixtures_templating/*.json')
    for file in globs:
        with open(file) as json_file:
            file_content = json.load(json_file)
            for test in file_content:
                test_cases.append(test)
    return test_cases


@pytest.mark.parametrize('data, context, expected_result', get_test_cases())
def test_aggregate_step_with_variables(data, context, expected_result):
    pipeline_with_variables = PipelineWithVariables(**data)

    pipeline = pipeline_with_variables.render(context, renderer=nosql_apply_parameters_to_query)

    expected_result = Pipeline(steps=expected_result)
    assert pipeline == expected_result
