import { Pipeline } from '@/lib/steps';

export type PipelinesScopeContext = {
  [pipelineName: string]: Pipeline;
};
/**
 * Dereference pipelines names in the current pipeline being edited, i.e.
 * replaces references to pipelines or sources (by their names) to their corresponding
 * pipelines
 *
 * @param pipeline the pipeline to translate and execute on the backend
 * @param pipelines the pipelines stored in the Vuex store of the app, as an
 * object with the pipeline name as key and the correspondinng pipeline as value
 *
 * @return the dereferenced pipeline
 */

/**
 * The corresponding pipeline of a source is the pipeline with the only step "source"
 */
function _getPipelineForSource(source: string): Pipeline {
  return [
    {
      name: 'source',
      source,
    },
  ];
}

/**
 * Return for a reference the corresponding pipeline
 */
function _dereferenceSourceOrPipeline(
  reference: string,
  pipelines: PipelinesScopeContext,
  sources: string[],
): Pipeline {
  if (sources.includes(reference)) {
    return _getPipelineForSource(reference);
  } else if (Object.keys(pipelines).includes(reference)) {
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    return dereferencePipelines(pipelines[reference], pipelines, sources);
  } else {
    throw `${reference} is neither a reference to an other pipeline neither reference to a source`;
  }
}

export function dereferencePipelines(
  pipeline: Pipeline,
  pipelines: PipelinesScopeContext,
  sources: string[],
): Pipeline {
  const dereferencedPipeline: Pipeline = [];
  for (const step of pipeline) {
    let newStep;
    switch (step.name) {
      case 'append':
        newStep = {
          ...step,
          pipelines: (step.pipelines as string[]).map(reference =>
            _dereferenceSourceOrPipeline(reference, pipelines, sources),
          ),
        };
        break;
      case 'join':
        newStep = {
          ...step,
          right_pipeline: _dereferenceSourceOrPipeline(
            step.right_pipeline as string,
            pipelines,
            sources,
          ),
        };
        break;
      // IMPORTANT: 'domain' should be renamed 'reference'
      case 'domain':
        newStep = {
          ...step,
          domain: _dereferenceSourceOrPipeline(step.domain as string, pipelines, sources),
        };
        break;
      default:
        newStep = { ...step };
        break;
    }
    dereferencedPipeline.push(newStep);
  }
  return dereferencedPipeline;
}
