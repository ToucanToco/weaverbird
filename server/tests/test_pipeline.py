from weaverbird.pipeline import Pipeline, PipelineWithVariables
from weaverbird.steps import FilterStep, FilterStepWithVariables, TopStep, TopStepWithVariables


def test_pipeline_with_variables():
    data = {
        'steps': [
            {'name': 'top', 'rank_on': 'price', 'sort': 'desc', 'limit': '{{ foo }}'},
            {
                'name': 'filter',
                'condition': {'column': 'foo', 'operator': 'lt', 'value': '{{ foo }}'},
            },
        ]
    }

    pipeline_with_variables = PipelineWithVariables(**data)
    assert pipeline_with_variables.steps == [
        TopStepWithVariables(name='top', rank_on='price', sort='desc', limit='{{ foo }}'),
        FilterStepWithVariables(
            name='filter', condition={'column': 'foo', 'operator': 'lt', 'value': '{{ foo }}'}
        ),
    ]

    pipeline = pipeline_with_variables.render({'foo': 42})
    expected_result = Pipeline(
        steps=[
            TopStep(name='top', rank_on='price', sort='desc', limit=42),
            FilterStep(name='filter', condition={'column': 'foo', 'operator': 'lt', 'value': 42}),
        ]
    )
    assert pipeline == expected_result
