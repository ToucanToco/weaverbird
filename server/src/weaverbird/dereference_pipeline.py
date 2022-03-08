from typing import Dict, List, Union

from weaverbird.pipeline import Pipeline
from weaverbird.pipeline.steps import DomainStep
from weaverbird.pipeline.steps.utils.combination import Reference


def _get_pipeline_for_domain(
    reference: Union[str, Reference],
    pipelines: Dict[str, Pipeline]
) -> List[Dict[str, str]]:
    if isinstance(reference, str) and reference in pipelines:
        return dereference_pipelines(pipelines[reference], pipelines)
    else:
        return [{'domain': reference, 'name': 'domain'}]


def dereference_pipelines(
    pipeline: Pipeline,
    pipelines: Dict[str, Pipeline]
) -> List[Dict[str, str]]:
    dereferenced_pipeline = []
    for step in pipeline.steps:
        match step.name:
            case 'domain':
                dereferenced_pipeline.append(
                    *_get_pipeline_for_domain(step.domain, pipelines)
                )
                break
            case 'append':
                dereferenced_pipeline.append(
                    {
                        **step.dict(),
                        'pipelines': map(lambda x: _get_pipeline_for_domain(x, pipelines), step.pipelines)
                    }
                )
                break
            case 'join':
                dereferenced_pipeline.append({
                    **step.dict(),
                    'right_pipeline': _get_pipeline_for_domain(step.right_pipeline, pipelines)
                })
                break
            case _:
                dereferenced_pipeline.append(step)
                break
    return dereferenced_pipeline

