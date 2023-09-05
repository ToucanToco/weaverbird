import json

import geopandas as gpd
import pandas as pd
import pytest
from toucan_connectors.common import nosql_apply_parameters_to_query
from weaverbird.backends.pandas_executor import execute_pipeline
from weaverbird.pipeline import PipelineWithVariables

from tests.utils import assert_dataframes_equals, get_spec_from_json_fixture, retrieve_case

test_cases = retrieve_case("pandas_executor", "pandas")


def _load_df(spec: dict) -> pd.DataFrame:
    return (
        pd.DataFrame(gpd.read_file(json.dumps(spec["data"])))
        if spec.get("schema") == "geojson"
        else pd.read_json(json.dumps(spec), orient="table")
    )


@pytest.mark.parametrize("case_id,case_spec_file_path", test_cases)
def test_pandas_execute_pipeline(case_id, case_spec_file_path, available_variables):
    spec = get_spec_from_json_fixture(case_id, case_spec_file_path)
    df_in = _load_df(spec["input"])
    df_out = _load_df(spec["expected"])
    dfs_in_others = {k: _load_df(v) for (k, v) in spec.get("other_inputs", {}).items()}

    steps = spec["step"]["pipeline"]
    steps.insert(0, {"name": "domain", "domain": "in"})
    pipeline = PipelineWithVariables(steps=steps).render(
        available_variables, nosql_apply_parameters_to_query
    )

    domains = {"in": df_in, **dfs_in_others}
    result = execute_pipeline(pipeline, domain_retriever=lambda x: domains[x])[0]

    assert_dataframes_equals(df_out, result)
