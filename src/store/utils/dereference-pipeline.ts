import { Pipeline, PipelineStep, Reference } from '@/lib/steps';

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

function getStepReferences(step: PipelineStep): Reference[] {
  switch (step.name) {
    case 'domain':
      return [step.domain];

    case 'append':
      return step.pipelines;

    case 'join':
      return [step.right_pipeline];

    default:
      return [];
  }
}

/**
 * Gets the names of all the pipelines referenced by the given one.
 *
 * @param      {Reference}              reference  The given pipeline or pipeline name
 * @param      {PipelinesScopeContext}  pipelines  All the known pipelines
 * @param      {Map}                    cachedResults A map of intermédiate results
 */
function _getPipelineNamesReferencedBy(
  reference: Reference,
  pipelines: PipelinesScopeContext,
  cachedResults: Map<string, Array<string>>,
): Array<string> {
  const referenceNames: Array<string> = [];
  if (typeof reference === 'string') {
    // if reference is a String
    const pipelineName = reference as string;
    // we add it to the results
    referenceNames.push(pipelineName);
    // if a pipeline with that name exist
    if (Object.keys(pipelines).includes(pipelineName)) {
      // if this pipeline name was not already done
      if (!cachedResults.has(pipelineName)) {
        // we restart with the pipeline referenced
        cachedResults.set(
          pipelineName,
          _getPipelineNamesReferencedBy(pipelines[pipelineName], pipelines, cachedResults),
        );
      }
      // we retreive the result
      referenceNames.push(...(cachedResults.get(pipelineName) || []));
    }
  } else {
    // if reference is a Pipeline
    const pipeline = reference as Pipeline;
    // we find all the references for 'domain', 'join' and 'append'
    const allStepReferences: Set<Reference> = new Set<Reference>();
    pipeline
      .map(getStepReferences)
      .forEach((stepReferences: Reference[]) =>
        stepReferences.forEach(stepReference => allStepReferences.add(stepReference)),
      );
    // and we restart with theses references
    allStepReferences.forEach((reference: Reference) => {
      referenceNames.push(..._getPipelineNamesReferencedBy(reference, pipelines, cachedResults));
    });
  }
  // remove possible duplicates
  return [...new Set(referenceNames)];
}

/**
 * Gets the names of all the pipelines referencing the given one.
 *
 * @param      {String}                 reference  The given pipeline or pipeline name
 * @param      {PipelinesScopeContext}  pipelines  All the known pipelines
 */
export function getPipelineNamesReferencing(reference: string, pipelines: PipelinesScopeContext) {
  // We use a simple Map as a cache for the already known results.
  const cachedResults: Map<string, Array<string>> = new Map();
  // the results
  const pipelineNames: Array<string> = [];
  // for each pipeline
  for (const pipelineName in pipelines) {
    // we find the referenced pipelines
    const references: Array<string> = _getPipelineNamesReferencedBy(
      pipelineName,
      pipelines,
      cachedResults,
    );
    // if the current pipeline (of this loop) is in the results
    if (references.includes(reference)) {
      // we had it to the array of results
      pipelineNames.push(pipelineName);
    }
  }
  // remove self from the references
  return pipelineNames.filter(name => name !== reference);
}

/**
 * Gets the names of all the pipelines referenced by the given one.
 *
 * @param      {Reference}              reference  The given pipeline or pipeline name
 * @param      {PipelinesScopeContext}  pipelines  All the known pipelines
 */
export function getPipelineNamesReferencedBy(
  reference: Reference,
  pipelines: PipelinesScopeContext,
): Array<string> {
  // This method is only wrap the private one to hide the cache from outside this module.
  return _getPipelineNamesReferencedBy(reference, pipelines, new Map());
}
