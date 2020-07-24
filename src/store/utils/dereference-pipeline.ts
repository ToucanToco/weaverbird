import { Pipeline } from '@/lib/steps';

export type PipelinesScopeContext = {
  [pipelineName: string]: Pipeline;
};

/**
 * Return a pipeline for the corresponding domain
 */
function _getPipelineForDomain(reference: string, pipelines: PipelinesScopeContext): Pipeline {
  if (Object.keys(pipelines).includes(reference)) {
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    return dereferencePipelines(pipelines[reference], pipelines);
  } else {
    return [{ domain: reference, name: 'domain' }];
  }
}

/**
 * Dereference pipelines names in the current pipeline being edited, i.e.
 * replaces references to pipelines or domains (by their names) to their corresponding
 * pipelines
 *
 * @param pipeline the pipeline to translate and execute on the backend
 * @param pipelines the pipelines stored in the Vuex store of the app, as an
 * object with the pipeline name as key and the correspondinng pipeline as value
 *
 * @return the dereferenced pipeline
 */
export function dereferencePipelines(
  pipeline: Pipeline,
  pipelines: PipelinesScopeContext,
): Pipeline {
  const dereferencedPipeline: Pipeline = [];
  for (const step of pipeline) {
    switch (step.name) {
      case 'domain':
        // if domain is a pipeline replace step by selected dereferenced pipeline steps
        dereferencedPipeline.push(..._getPipelineForDomain(step.domain, pipelines));
        break;
      case 'append':
        dereferencedPipeline.push({
          ...step,
          pipelines: (step.pipelines as string[]).map(reference =>
            _getPipelineForDomain(reference, pipelines),
          ),
        });
        break;
      case 'join':
        dereferencedPipeline.push({
          ...step,
          right_pipeline: _getPipelineForDomain(step.right_pipeline as string, pipelines),
        });
        break;

      default:
        dereferencedPipeline.push(step);
        break;
    }
  }
  return dereferencedPipeline;
}
