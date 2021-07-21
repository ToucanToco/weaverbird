from functools import partial

import pytest

from weaverbird.backends.sql_translator.sql_pipeline_translator import (
    SQLPipelineTranslationFailure,
    translate_pipeline,
)
from weaverbird.pipeline import Pipeline

DOMAINS = {'domain_a': 'SELECT title FROM books'}


@pytest.fixture
def pipeline_translator():
    return partial(translate_pipeline, sql_query_retriever=lambda name: DOMAINS[name])


def test_extract_query(pipeline_translator):
    q, _ = pipeline_translator(Pipeline(steps=[{'name': 'domain', 'domain': 'domain_a'}]))
    assert q == 'WITH SELECT_STEP_0 AS (SELECT title FROM books) SELECT * FROM SELECT_STEP_0'


def test_errors(pipeline_translator, mocker):
    """
    It should provide helpful information when the pipeline translation fails, such as:
    - the step that encountered an error (nth and type)
    - the original exception message
    """
    mocker.patch(
        'weaverbird.backends.sql_translator.steps.filter.apply_condition',
        side_effect=Exception('comparison ' 'not ' 'implemented'),
    )
    with pytest.raises(SQLPipelineTranslationFailure) as trslinfo:
        pipeline_translator(
            Pipeline(
                steps=[
                    {
                        'name': 'filter',
                        'condition': {
                            'column': 'title',
                            'operator': 'eq',
                        },
                    },
                ]
            )
        )
    exception_message = trslinfo.value.message
    assert 'Step #1' in exception_message
    assert 'filter' in exception_message
    assert 'comparison' in exception_message
    assert trslinfo.value.details['index'] == 0
    assert trslinfo.value.details['message'] == exception_message


def test_report(pipeline_translator):
    _, report = pipeline_translator(
        Pipeline(
            steps=[
                {'name': 'domain', 'domain': 'domain_a'},
            ]
        )
    )
    # there should be one step_report per step in the pipeline
    assert len(report.sql_steps_translation_reports) == 1


def test_translation_pipeline(pipeline_translator, mocker):
    query_string, _ = pipeline_translator(
        Pipeline(
            steps=[
                {'name': 'domain', 'domain': 'domain_a'},
                {
                    'name': 'filter',
                    'condition': {'column': 'title', 'operator': 'isnull'},
                },
            ]
        )
    )
    assert (
        query_string
        == 'WITH SELECT_STEP_0 AS (SELECT title FROM books), FILTER_STEP_1 AS (SELECT * FROM SELECT_STEP_0 WHERE title IS NULL) SELECT * FROM FILTER_STEP_1'
    )
