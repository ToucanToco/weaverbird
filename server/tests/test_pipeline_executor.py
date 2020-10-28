"""
This file contain end-to-end tests for pipeline execution
"""
import json
from os import path

import pandas as pd
import pytest

from tests.utils import assert_dataframes_equals
from weaverbird.pipeline_executor import PipelineExecutor

df_domain_a = pd.read_csv(path.join(path.dirname(__file__), 'fixtures/domain_a.csv'))
DOMAINS = {'domain_a': df_domain_a}


@pytest.fixture
def pipeline_executor():
    return PipelineExecutor(domain_retriever=lambda name: DOMAINS[name])


def test_preview_pipeline(pipeline_executor):
    result = pipeline_executor.preview_pipeline(
        [
            {'name': 'domain', 'domain': 'domain_a'},
        ]
    )
    result_loaded = json.loads(result)
    assert 'data' in result_loaded
    assert len(result_loaded['data']) == 3  # rows
    assert len(result_loaded['data'][0]) == 4  # columns
    assert result_loaded['schema']['fields'] == [
        {'name': 'index', 'type': 'integer'},
        {'name': 'colA', 'type': 'string'},
        {'name': 'colB', 'type': 'integer'},
        {'name': 'colC', 'type': 'integer'},
    ]


def test_preview_pipeline_limit(pipeline_executor):
    result = pipeline_executor.preview_pipeline(
        [
            {'name': 'domain', 'domain': 'domain_a'},
        ],
        limit=1,
    )
    result_loaded = json.loads(result)
    assert result_loaded['data'] == [
        {'colA': 'toto', 'colB': 1, 'colC': 100, 'index': 0}
    ]  # first row of the data frame


def test_preview_pipeline_limit_offset(pipeline_executor):
    result = pipeline_executor.preview_pipeline(
        [
            {'name': 'domain', 'domain': 'domain_a'},
        ],
        limit=3,
        offset=2,
    )
    result_loaded = json.loads(result)
    assert result_loaded['data'] == [
        {'colA': 'tata', 'colB': 3, 'colC': 25, 'index': 2}  # third row of the data frame
        # no other row after that one
    ]


def test_extract_domain(pipeline_executor: PipelineExecutor):
    df = pipeline_executor.execute_pipeline([{'name': 'domain', 'domain': 'domain_a'}])

    assert_dataframes_equals(
        df,
        pd.DataFrame(df_domain_a),
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
