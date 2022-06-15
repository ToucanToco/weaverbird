import json

import geopandas as gpd
import pandas as pd
import pytest

from tests.utils import assert_dataframes_equals, get_spec_from_json_fixture, retrieve_case
from weaverbird.backends.pandas_executor import execute_pipeline
from weaverbird.pipeline import Pipeline

test_cases = retrieve_case('pandas_executor', 'pandas')


def _load_df(spec: dict) -> pd.DataFrame:
    return (
        pd.DataFrame(gpd.read_file(json.dumps(spec['data'])))
        if spec.get('schema') == 'geojson'
        else pd.read_json(json.dumps(spec), orient='table')
    )


@pytest.mark.parametrize('case_id,case_spec_file_path', test_cases)
def test_pandas_execute_pipeline(case_id, case_spec_file_path):
    spec = get_spec_from_json_fixture(case_id, case_spec_file_path)
    df_in = _load_df(spec['input'])
    df_out = _load_df(spec['expected'])
    dfs_in_others = {k: _load_df(v) for (k, v) in spec.get('other_inputs', {}).items()}

    steps = spec['step']['pipeline']
    steps.insert(0, {'name': 'domain', 'domain': 'in'})
    pipeline = Pipeline(steps=steps)

    DOMAINS = {'in': df_in, **dfs_in_others}
    result = execute_pipeline(pipeline, domain_retriever=lambda x: DOMAINS[x])[0]

    assert_dataframes_equals(df_out, result)
