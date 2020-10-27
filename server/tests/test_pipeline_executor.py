"""
This file contain end-to-end tests for pipeline execution
"""

from os import path

import pandas as pd
import pytest

from tests.utils import assert_dataframes_equals
from weaverbird.pipeline_executor import PipelineExecutor

DOMAINS = {'domain_a': pd.read_csv(path.join(path.dirname(__file__), 'fixtures/domain_a.csv'))}


@pytest.fixture
def pipeline_executor():
    return PipelineExecutor(domain_retriever=lambda name: DOMAINS[name])


def test_extract_domain(pipeline_executor: PipelineExecutor):
    df = pipeline_executor.execute_pipeline([{'name': 'domain', 'domain': 'domain_a'}])

    assert_dataframes_equals(
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


def test_rename(pipeline_executor):
    df = pipeline_executor.execute_pipeline(
        [
            {'name': 'domain', 'domain': 'domain_a'},
            {'name': 'rename', 'toRename': [['colA', 'col_a'], ['colB', 'col_b']]},
        ]
    )

    assert_dataframes_equals(
        df,
        pd.DataFrame(
            {'col_a': ['toto', 'tutu', 'tata'], 'col_b': [1, 2, 3], 'colC': [100, 50, 25]}
        ),
    )
