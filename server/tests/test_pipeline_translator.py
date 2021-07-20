from functools import partial

import pytest

from server.weaverbird.backends.sql_translator.sql_pipeline_translator import (
    SQLPipelineTranslationFailure,
    translate_pipeline,
)
from server.weaverbird.pipeline import Pipeline

DOMAINS = {'domain_a': 'select title from books'}


@pytest.fixture
def pipeline_translator():
    return partial(translate_pipeline, sql_table_retriever=lambda name: DOMAINS[name])


def test_extract_query(pipeline_translator):
    q, _ = pipeline_translator(Pipeline(steps=[{'name': 'domain', 'domain': 'domain_a'}]))
    assert (
        f'{q.transformed_query}{q.selection_query}'
        == 'with select_step_0 as (select title from books),select * '
        'from select_step_0'
    )


def test_errors(pipeline_translator):
    """
    It should provide helpful information when the pipeline translation fails, such as:
    - the step that encountered an error (nth and type)
    - the original exception message
    """
    with pytest.raises(SQLPipelineTranslationFailure) as trslinfo:
        pipeline_translator(
            Pipeline(
                steps=[
                    {
                        'name': 'filter',
                        'condition': {'column': 'title', 'operator': 'isnull'},
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
