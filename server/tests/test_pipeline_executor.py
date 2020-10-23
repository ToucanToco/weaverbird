"""
This file contain end-to-end tests for pipeline execution
"""

from os import path

import pandas as pd
import pytest
from pandas.testing import assert_frame_equal

from weaverbird.pipeline_executor import PipelineExecutor

DOMAINS = {'domain_a': pd.read_csv(path.join(path.dirname(__file__), 'fixtures/domain_a.csv'))}


@pytest.fixture
def pipeline_executor():
    return PipelineExecutor(domain_retriever=lambda name: DOMAINS[name])


def assert_dataframes_equals(left: pd.DataFrame, right: pd.DataFrame):
    """
    Compare two dataframes columns and values, not their index.
    """
    assert_frame_equal(left.reset_index(drop=True), right.reset_index(drop=True))


def test_extract_domain(pipeline_executor: PipelineExecutor):
    df = pipeline_executor.execute_pipeline([{'name': 'domain', 'domain': 'domain_a'}])

    assert_frame_equal(
        df,
        pd.DataFrame({'colA': ['toto', 'tutu', 'tata'], 'colB': [1, 2, 3], 'colC': [100, 50, 25]}),
    )


def test_filter(pipeline_executor):
    df = pipeline_executor.execute_pipeline(
        [
            {'name': 'domain', 'domain': 'domain_a'},
            {'name': 'filter', 'condition': {'column': 'colA', 'operator': 'eq', 'value': 'tutu'}},
        ]
    )

    assert_dataframes_equals(
        df,
        pd.DataFrame({'colA': ['tutu'], 'colB': [2], 'colC': [50]}),
    )
