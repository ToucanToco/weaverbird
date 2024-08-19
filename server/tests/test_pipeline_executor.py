"""
This file contain end-to-end tests for pipeline execution

TODO move to tests/backends/pandas_executor
"""

import json
from functools import partial
from os import path

import pandas as pd
import pytest
from pytest_mock import MockFixture

from tests.utils import assert_dataframes_equals
from weaverbird.backends.pandas_executor.pipeline_executor import (
    PipelineExecutionFailure,
    execute_pipeline,
    preview_pipeline,
)
from weaverbird.pipeline import Pipeline

df_domain_a = pd.read_csv(path.join(path.dirname(__file__), "fixtures/domain_a.csv"))
DOMAINS = {"domain_a": df_domain_a}


@pytest.fixture
def pipeline_executor():
    return partial(execute_pipeline, domain_retriever=lambda name: DOMAINS[name])


@pytest.fixture
def pipeline_previewer():
    return partial(preview_pipeline, domain_retriever=lambda name: DOMAINS[name])


def test_preview_pipeline(mocker: MockFixture, pipeline_previewer):
    df_to_json_spy = mocker.spy(pd.DataFrame, "to_json")
    result = json.loads(
        pipeline_previewer(
            Pipeline(
                steps=[
                    {"name": "domain", "domain": "domain_a"},
                ]
            )
        )
    )
    assert "data" in result
    assert len(result["data"]) == 3  # rows
    assert len(result["data"][0]) == 3  # columns
    assert result["schema"]["fields"] == [
        {"name": "colA", "type": "string"},
        {"name": "colB", "type": "integer"},
        {"name": "colC", "type": "integer"},
    ]
    assert result["offset"] == 0
    assert result["limit"] == 50
    assert result["total"] == 3

    # DataFrames must be exported with pandas' method to ensure NaN and dates are correctly converted
    df_to_json_spy.assert_called_once()


def test_preview_pipeline_limit(pipeline_previewer):
    result = pipeline_previewer(
        Pipeline(
            steps=[
                {"name": "domain", "domain": "domain_a"},
            ]
        ),
        limit=1,
    )
    assert json.loads(result)["data"] == [{"colA": "toto", "colB": 1, "colC": 100}]  # first row of the data frame


def test_preview_pipeline_limit_offset(pipeline_previewer):
    result = pipeline_previewer(
        Pipeline(
            steps=[
                {"name": "domain", "domain": "domain_a"},
            ]
        ),
        limit=3,
        offset=2,
    )
    assert json.loads(result)["data"] == [
        {"colA": "tata", "colB": 3, "colC": 25}  # third row of the data frame
        # no other row after that one
    ]


def test_extract_domain(pipeline_executor):
    df, _ = pipeline_executor(Pipeline(steps=[{"name": "domain", "domain": "domain_a"}]))

    assert_dataframes_equals(df, pd.DataFrame(df_domain_a))


def test_filter(pipeline_executor):
    df, _ = pipeline_executor(
        Pipeline(
            steps=[
                {"name": "domain", "domain": "domain_a"},
                {
                    "name": "filter",
                    "condition": {"column": "colA", "operator": "eq", "value": "tutu"},
                },
            ]
        )
    )

    assert_dataframes_equals(
        df,
        pd.DataFrame({"colA": ["tutu"], "colB": [2], "colC": [50]}),
    )


def test_rename(pipeline_executor):
    df, _ = pipeline_executor(
        Pipeline(
            steps=[
                {"name": "domain", "domain": "domain_a"},
                {"name": "rename", "toRename": [["colA", "col_a"], ["colB", "col_b"]]},
            ]
        )
    )

    assert_dataframes_equals(
        df,
        pd.DataFrame({"col_a": ["toto", "tutu", "tata"], "col_b": [1, 2, 3], "colC": [100, 50, 25]}),
    )


def test_errors(pipeline_executor):
    """
    It should provide helpful information when the pipeline execution fails, such as:
    - the step that encountered an error (nth and type)
    - the original exception message
    """
    with pytest.raises(PipelineExecutionFailure) as excinfo:
        pipeline_executor(
            Pipeline(
                steps=[
                    {"name": "domain", "domain": "domain_a"},
                    {
                        "name": "sort",
                        "columns": [{"column": "whatever", "order": "asc"}],
                    },
                ]
            )
        )
    exception_message = excinfo.value.message
    assert "Step #2" in exception_message
    assert "sort" in exception_message
    assert "whatever" in exception_message
    assert excinfo.value.details["index"] == 1
    assert excinfo.value.details["message"] == exception_message


def test_report(pipeline_executor):
    _, report = pipeline_executor(
        Pipeline(
            steps=[
                {"name": "domain", "domain": "domain_a"},
                {"name": "rename", "toRename": [["colA", "col_a"], ["colB", "col_b"]]},
            ]
        )
    )
    # there should be one step_report per step in the pipeline
    assert len(report.steps_reports) == 2
