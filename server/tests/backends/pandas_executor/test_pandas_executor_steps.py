import json
from glob import glob
from os import path

import pandas as pd
import pytest

from tests.utils import assert_dataframes_equals
from weaverbird.backends.pandas_executor import execute_pipeline
from weaverbird.pipeline import Pipeline

step_cases_files = glob('../fixtures/*/*.step.json')

test_cases = []
for x in step_cases_files:
    case_hierarchy = path.dirname(x)[len('../fixtures/') :]
    case_name = path.splitext(path.basename(x))[0].split('.')[0]
    case_id = case_hierarchy + '_' + case_name

    # Path of the file specifying the step to test (xxx.step.json)
    step_file_path = x

    # Path of the file specifying the input dataframe (xxx.in.json)
    in_file_path = path.join(path.dirname(x), f'{case_name}.in.json')

    # Combination test requires other dataframes (xxx.in.domain_name.json)
    other_in_files = glob(path.join(path.dirname(x), f'{case_name}.in.*.json'))
    # Extract their domain name and map them to their file path ({ domain_name: 'path/xxx.in.domain_name.json' })
    other_in_files_domains = {
        path.splitext(path.basename(oif))[0].split('.')[-1]: oif for oif in other_in_files
    }

    # Path of the file specifying the expected output dataframe (xxx.out.json)
    out_file_path = path.join(path.dirname(x), f'{case_name}.out.json')

    test_cases.append(
        pytest.param(
            case_id, step_file_path, in_file_path, other_in_files_domains, out_file_path, id=case_id
        )
    )


@pytest.mark.parametrize(
    'case_id,step_file_path,in_file_path,other_in_files_domains,out_file_path', test_cases
)
def test_pandas_execute_pipeline(
    case_id, step_file_path, in_file_path, other_in_files_domains, out_file_path
):
    step_file = open(step_file_path, 'r')
    step = json.loads(step_file.read())
    step_file.close()

    df_in = pd.read_json(in_file_path, orient='table')
    df_out = pd.read_json(out_file_path, orient='table')
    dfs_in_others = {
        k: pd.read_json(v, orient='table') for (k, v) in other_in_files_domains.items()
    }

    pipeline = Pipeline(steps=[{'name': 'domain', 'domain': 'in'}, step])
    DOMAINS = {'in': df_in, **dfs_in_others}
    result = execute_pipeline(pipeline, domain_retriever=lambda x: DOMAINS[x])[0]

    assert_dataframes_equals(df_out, result)
