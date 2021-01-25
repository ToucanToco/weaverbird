import pytest

from weaverbird.pipeline import Pipeline, PipelineWithVariables
from weaverbird.steps import FilterStep, FilterStepWithVariables, TopStep, TopStepWithVariables
from weaverbird.steps.aggregate import AggregateStep, Aggregation


def test_pipeline_with_variables():
    data = {
        'steps': [
            {'name': 'top', 'rank_on': '{{ bar }}', 'sort': 'desc', 'limit': '{{ foo }}'},
            {
                'name': 'filter',
                'condition': {'column': 'foo', 'operator': 'lt', 'value': '{{ foo }}'},
            },
        ]
    }

    pipeline_with_variables = PipelineWithVariables(**data)
    assert pipeline_with_variables.steps == [
        TopStepWithVariables(name='top', rank_on='{{ bar }}', sort='desc', limit='{{ foo }}'),
        FilterStepWithVariables(
            name='filter', condition={'column': 'foo', 'operator': 'lt', 'value': '{{ foo }}'}
        ),
    ]

    pipeline = pipeline_with_variables.render({'foo': 42, 'bar': 'price'})
    expected_result = Pipeline(
        steps=[
            TopStep(name='top', rank_on='price', sort='desc', limit=42),
            FilterStep(name='filter', condition={'column': 'foo', 'operator': 'lt', 'value': 42}),
        ]
    )
    assert pipeline == expected_result


test_data_for_templates = [
    (
        {
            'steps': [
                {
                    'name': 'aggregate',
                    'on': [],
                    'aggregations': [
                        {
                            'columns': ['{{ base_column }}'],
                            'aggfunction': '{{ agg_fn }}',
                            'newcolumns': ['{{ result_column }}'],
                        }
                    ],
                },
            ]
        },
        {'base_column': 'foo', 'agg_fn': 'sum', 'result_column': 'new_foo'},
        [
            AggregateStep(
                name='aggregate',
                on=[],
                aggregations=[
                    Aggregation(columns=['foo'], aggfunction='sum', newcolumns=['new_foo'])
                ],
            )
        ],
    ),
]


@pytest.mark.parametrize('data, context, expected_result', test_data_for_templates)
def test_aggregate_step_with_variables(data, context, expected_result):
    pipeline_with_variables = PipelineWithVariables(**data)

    pipeline = pipeline_with_variables.render(context)

    expected_result = Pipeline(steps=expected_result)
    assert pipeline == expected_result
