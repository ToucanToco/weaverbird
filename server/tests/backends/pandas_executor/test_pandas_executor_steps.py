import json

import pandas as pd
import pytest

from server.tests.utils import assert_dataframes_equals, retrieve_case
from weaverbird.backends.pandas_executor import execute_pipeline
from weaverbird.pipeline import Pipeline

test_cases = retrieve_case('pandas_executor', 'pandas')


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

    steps = spec['step']['pipeline']
    steps.insert(0, {'name': 'domain', 'domain': 'in'})
    pipeline = Pipeline(steps=steps)

    DOMAINS = {'in': df_in, **dfs_in_others}
    result = execute_pipeline(pipeline, domain_retriever=lambda x: DOMAINS[x])[0]

    assert_dataframes_equals(df_out, result)
