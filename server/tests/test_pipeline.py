import glob
import json
from typing import Dict, List

import pytest
from pydantic.main import BaseModel
from toucan_connectors.common import nosql_apply_parameters_to_query

from weaverbird.pipeline import Pipeline, PipelineWithVariables


class Case(BaseModel):
    filename: str
    data: Dict
    context: Dict
    expected_result: List


def get_render_variables_test_cases():
    test_cases = []
    globs = glob.glob('./tests/fixtures/fixtures_templating/*.json')
    for file in globs:
        with open(file) as json_file:
            file_content = json.load(json_file)
            for test in file_content:
                case = Case(filename=file, data=test[0], context=test[1], expected_result=test[2])
                test_cases.append(case)
    return test_cases


cases = get_render_variables_test_cases()
ids = map(lambda x: x.filename, cases)


@pytest.mark.parametrize('case', cases, ids=ids)
def test_step_with_variables(case: Case):
    pipeline_with_variables = PipelineWithVariables(**case.data)

    pipeline = pipeline_with_variables.render(
        case.context, renderer=nosql_apply_parameters_to_query
    )

    expected_result = Pipeline(steps=case.expected_result)
    assert pipeline == expected_result
