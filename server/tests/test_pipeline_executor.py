"""
This file contain end-to-end tests for pipeline execution
"""
import json
from os import path

import pandas as pd
import pytest
from pytest_mock import MockFixture

from tests.utils import assert_dataframes_equals
from weaverbird.pipeline_executor import PipelineExecutor

df_domain_a = pd.read_csv(path.join(path.dirname(__file__), 'fixtures/domain_a.csv'))
DOMAINS = {'domain_a': df_domain_a}


@pytest.fixture
def pipeline_executor():
    return PipelineExecutor(domain_retriever=lambda name: DOMAINS[name])


def test_preview_pipeline(mocker: MockFixture, pipeline_executor):
    df_to_json_spy = mocker.spy(pd.DataFrame, 'to_json')
    result = json.loads(
        pipeline_executor.preview_pipeline(
            [
                {'name': 'domain', 'domain': 'domain_a'},
            ]
        )
    )
    assert 'data' in result
    assert len(result['data']) == 3  # rows
    assert len(result['data'][0]) == 3  # columns
    assert result['schema']['fields'] == [
        {'name': 'colA', 'type': 'string'},
        {'name': 'colB', 'type': 'integer'},
        {'name': 'colC', 'type': 'integer'},
    ]
    assert result['offset'] == 0
    assert result['limit'] == 50
    assert result['total'] == 3

    # DataFrames must be exported with pandas' method to ensure NaN and dates are correctly converted
    df_to_json_spy.assert_called_once()


def test_preview_pipeline_limit(pipeline_executor):
    result = pipeline_executor.preview_pipeline(
        [
            {'name': 'domain', 'domain': 'domain_a'},
        ],
        limit=1,
    )
    assert json.loads(result)['data'] == [
        {'colA': 'toto', 'colB': 1, 'colC': 100}
    ]  # first row of the data frame


def test_preview_pipeline_limit_offset(pipeline_executor):
    result = pipeline_executor.preview_pipeline(
        [
            {'name': 'domain', 'domain': 'domain_a'},
        ],
        limit=3,
        offset=2,
    )
    assert json.loads(result)['data'] == [
        {'colA': 'tata', 'colB': 3, 'colC': 25}  # third row of the data frame
        # no other row after that one
    ]


def test_extract_domain(pipeline_executor: PipelineExecutor):
    df = pipeline_executor.execute_pipeline([{'name': 'domain', 'domain': 'domain_a'}])

    assert_dataframes_equals(df, pd.DataFrame(df_domain_a))


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
