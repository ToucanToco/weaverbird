from os import path

import pandas as pd
import pytest
from pandas.testing import assert_frame_equal

from weaverbird.pipeline_executor import PipelineExecutor

DOMAINS = {'domain_a': pd.read_csv(path.join(path.dirname(__file__), 'fixtures/domain_a.csv'))}


@pytest.fixture
def pipeline_executor():
    return PipelineExecutor(domain_retriever=lambda name: DOMAINS[name])


def test_extract_domain(pipeline_executor):
    df = pipeline_executor.execute_pipeline([{'name': 'domain', 'domain': 'domain_a'}])

    assert_frame_equal(
        df,
        pd.DataFrame({'colA': ['toto', 'tutu', 'tata'], 'colB': [1, 2, 3], 'colC': [100, 50, 25]}),
    )
