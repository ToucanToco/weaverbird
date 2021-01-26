import json

import pytest

from weaverbird.pipeline import Pipeline, PipelineWithVariables
from weaverbird.steps import FilterStep, FilterStepWithVariables, TopStep, TopStepWithVariables


with open('fixtures/fixtures_templating/aggregate.json') as json_file:
    test_data_for_templates = json.load(json_file)


@pytest.mark.parametrize('data, context, expected_result', test_data_for_templates)
def test_aggregate_step_with_variables(data, context, expected_result):
    pipeline_with_variables = PipelineWithVariables(**data)

    pipeline = pipeline_with_variables.render(context)

    expected_result = Pipeline(steps=expected_result)
    assert pipeline == expected_result
