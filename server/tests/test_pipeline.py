import glob
import json

import pytest

from weaverbird.pipeline import Pipeline, PipelineWithVariables


def get_test_cases():
    test_cases = []
    globs = glob.glob('fixtures/fixtures_templating/*.json')
    for file in globs:
        print(file)
        with open(file) as json_file:
            file_content = json.load(json_file)
            for test in file_content:
                test_cases.append(test)
    return test_cases


@pytest.mark.parametrize('data, context, expected_result', get_test_cases())
def test_aggregate_step_with_variables(data, context, expected_result):
    print(data)
    print(context)
    print(expected_result)
    pipeline_with_variables = PipelineWithVariables(**data)

    pipeline = pipeline_with_variables.render(context)

    expected_result = Pipeline(steps=expected_result)
    assert pipeline == expected_result
