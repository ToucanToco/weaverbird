import json
from glob import glob
from os import path

import pandas as pd
import pytest

from tests.utils import assert_dataframes_equals
from weaverbird.backends.pandas_executor import execute_pipeline
from weaverbird.pipeline import Pipeline

fixtures_dir_path = path.join(path.dirname(path.realpath(__file__)), '../fixtures')
step_cases_files = glob(path.join(fixtures_dir_path, '*/*.json'))

test_cases = []
for x in step_cases_files:
    # Generate a readable id for each test case
    case_hierarchy = path.dirname(x)[len(fixtures_dir_path) :]
    case_name = path.splitext(path.basename(x))[0]
    case_id = case_hierarchy + '_' + case_name

    test_cases.append(pytest.param(case_id, x, id=case_id))


@pytest.mark.parametrize('case_id,case_spec_file_path', test_cases)
def test_pandas_execute_pipeline(case_id, case_spec_file_path):
    spec_file = open(case_spec_file_path, 'r')
    spec = json.loads(spec_file.read())
    spec_file.close()

    df_in = pd.read_json(json.dumps(spec['input']), orient='table')
    df_out = pd.read_json(json.dumps(spec['expected']), orient='table')
    dfs_in_others = {
        k: pd.read_json(json.dumps(v), orient='table')
        for (k, v) in spec.get('other_inputs', {}).items()
    }

    pipeline = Pipeline(steps=[{'name': 'domain', 'domain': 'in'}, spec['step']])
    DOMAINS = {'in': df_in, **dfs_in_others}
    result = execute_pipeline(pipeline, domain_retriever=lambda x: DOMAINS[x])[0]

    assert_dataframes_equals(df_out, result)
