from typing import Any, Dict, List, Union

from weaverbird.pipeline import Pipeline
from weaverbird.pipeline.steps.utils.combination import Reference


def _get_pipeline_for_domain(
    reference: Union[Any, List[Dict[Any, Any]], str, Reference], pipelines: Dict[str, Pipeline]
) -> Any:
    if isinstance(reference, str) and reference in pipelines:
        return dereference_pipelines(pipelines[reference], pipelines)
    else:
        return [{'domain': reference, 'name': 'domain'}]


def dereference_pipelines(
    pipeline: Pipeline, pipelines: Dict[str, Pipeline]
) -> List[Dict[str, List[Reference]]]:
    dereferenced_pipeline = []  # type: ignore
    for step in pipeline.steps:
        if step.name == 'domain':
            dereferenced_pipeline.append(*_get_pipeline_for_domain(step.domain, pipelines))  # type: ignore
        elif step.name == 'append':
            dereferenced_pipeline.append(
                {
                    **step.dict(),
                    'pipelines': list(
                        map(
                            lambda x: _get_pipeline_for_domain(x, pipelines),
                            step.pipelines,  # type:ignore
                        )
                    ),
                }
            )
        elif step.name == 'join':
            dereferenced_pipeline.append(
                {
                    **step.dict(),
                    'right_pipeline': _get_pipeline_for_domain(
                        step.right_pipeline, pipelines  # type:ignore
                    ),
                }
            )
        else:
            dereferenced_pipeline.append(step)  # type: ignore

    return dereferenced_pipeline
