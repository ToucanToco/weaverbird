import logging
from typing import List

from weaverbird.pipeline import Pipeline, steps
from weaverbird.pipeline.steps import AppendStep, DomainStep

logger = logging.getLogger(__name__)


def translate_append(step: AppendStep) -> List:
    from weaverbird.backends.mongo_translator.mongo_pipeline_translator import translate_pipeline

    pipelines = step.pipelines
    pipelines_names = ['$_vqbPipelineInline']
    lookups = []

    for i, sub_pipeline in enumerate(pipelines):
        assert isinstance(sub_pipeline, list)
        assert isinstance(sub_pipeline[0], dict)
        domain_step: DomainStep = DomainStep(**sub_pipeline[0])
        pipeline_without_domain = Pipeline(
            steps=[getattr(steps, f"{s['name'].capitalize()}Step")(**s) for s in sub_pipeline[1:]]
        )
        lookups.append(
            {
                '$lookup': {
                    'from': domain_step.domain,
                    'pipeline': translate_pipeline(pipeline_without_domain),
                    'as': f'_vqbPipelineToAppend_{i}',
                }
            }
        )
        pipelines_names.append(f'$_vqbPipelineToAppend_{i}')
    return [
        {'$group': {'_id': None, '_vqbPipelineInline': {'$push': '$$ROOT'}}},
        *lookups,
        {'$project': {'_vqbPipelinesUnion': {'$concatArrays': pipelines_names}}},
        {'$unwind': '$_vqbPipelinesUnion'},
        {'$replaceRoot': {'newRoot': '$_vqbPipelinesUnion'}},
    ]
