/**
 * define what the application state looks like.
 */
import _fromPairs from 'lodash/fromPairs';

import { BackendError } from '@/lib/backend-response';
import { DataSet } from '@/lib/dataset';
import { Pipeline, PipelineStepName } from '@/lib/steps';
import { InterpolateFunction, PipelineInterpolator, ScopeContext } from '@/lib/templating';

export interface VQBState {
  /**
   * the current dataset.
   */
  dataset: DataSet;
  /**
   * the current list of domains available.
   */
  domains: string[];
  /**
   * FIXME should be a getter from the current pipeline
   * the domain currently selected.
   */
  currentDomain?: string;
  /**
   * the current pipeline (being edited) name
   */
  currentPipelineName?: string;
  /**
   * the current step form displayed
   */
  currentStepFormName?: PipelineStepName;
  /**
   * the last step currently active.
   */
  selectedStepIndex: number;

  /**
   * saved pipelines, with unique name as key and pipeline as value
   */
  pipelines: { [name: string]: Pipeline };

  /**
   * object used to fill an edit step form
   */
  stepFormInitialValue?: object;
  /**
   * object used to setup edit step form initially without interfering with
   * `stepFormInitialValue` which has to be left undefined so that default
   * StepForm's props can be used by VueJS.
   *
   * NOTE: This needs to be refactored, that's too many different properties for
   * a single concern (i.e. form filling)
   */
  stepFormDefaults?: object;

  /**
   * the seclected columns (materialized by a styled focus on the DataViewer)
   */
  selectedColumns: string[];

  /**
   * pagination size (i.e. number of results displayed)
   */
  pagesize: number;

  /**
   * error send by backend or catch from its interface
   */
  backendErrors: BackendError[];

  /**
   * whether the data are loading
   */
  isLoading: boolean;

  /**
   * whether a request to backend service is on ongoing
   */
  isRequestOnGoing: boolean;

  /**
   * variables scope, if any.
   */
  variables?: ScopeContext;

  /**
   * interpolation function
   */
  interpolateFunc?: InterpolateFunction;

  /**
   * the app translator
   */
  translator: string;
}

/**
 * generate the default empty state, useful to update just some parts of it
 * when creating the initial version of store.
 */
export function emptyState(): VQBState {
  return {
    dataset: {
      headers: [],
      data: [],
      paginationContext: {
        pagesize: 50,
        pageno: 1,
        totalCount: 0,
      },
    },
    domains: [],
    currentStepFormName: undefined,
    stepFormInitialValue: undefined,
    stepFormDefaults: undefined,
    selectedStepIndex: -1,
    currentPipelineName: undefined,
    pipelines: {},
    selectedColumns: [],
    pagesize: 50,
    backendErrors: [],
    isLoading: false,
    isRequestOnGoing: false,
    variables: {},
    translator: 'mongo40',
    interpolateFunc: (x: string, _context: ScopeContext) => x,
  };
}

/**
 * @param state current application state
 * @return the pipeline currently edited
 */
export function currentPipeline(state: VQBState) {
  if (!state.currentPipelineName) {
    return;
  }
  return state.pipelines[state.currentPipelineName];
}

/**
 * @param pipeline the current pipeline
 * @param selectedStepIndex
 * @return the index of the first inactive step. Return first out of bound index
 * if all steps are active.
 */
function firstNonSelectedIndex(pipeline: Pipeline, selectedStepIndex: number) {
  if (selectedStepIndex < 0) {
    return pipeline.length;
  }
  return selectedStepIndex + 1;
}

/**
 * @param state current application state
 * @return the subpart of the pipeline that is currently active.
 */
export function activePipeline(state: VQBState) {
  const pipeline = currentPipeline(state);
  return pipeline?.slice(0, firstNonSelectedIndex(pipeline, state.selectedStepIndex));
}

/**
 * @param state current application state
 * @return the subpart of the pipeline that is currently inactive.
 */
export function inactivePipeline(state: VQBState) {
  const pipeline = currentPipeline(state);
  return pipeline?.slice(firstNonSelectedIndex(pipeline, state.selectedStepIndex));
}

type PipelinesScopeContext = {
  [pipelineName: string]: Pipeline;
};
/**
 * Dereference pipelines names in the current pipeline being edited, i.e.
 * replaces references to pipelines (by their names) to their corresponding
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
    let newStep;
    if (step.name === 'append') {
      const pipelineNames = step.pipelines as string[];
      newStep = {
        ...step,
        pipelines: pipelineNames.map(p => dereferencePipelines(pipelines[p], pipelines)),
      };
    } else if (step.name === 'join') {
      const rightPipelineName = step.right_pipeline as string;
      newStep = {
        ...step,
        right_pipeline: dereferencePipelines(pipelines[rightPipelineName], pipelines),
      };
    } else {
      newStep = { ...step };
    }
    dereferencedPipeline.push(newStep);
  }
  return dereferencedPipeline;
}

/**
 * `preparePipeline` responsibility is to prepare the pipeline so as to be ready for direct translation.
 * Specifically, this consists in 2 things:
 *   - dereferencePipelines
 *   - interpolate if an `interpolateFunc` has been set
 */
export function preparePipeline(pipeline: any, state: VQBState) {
  if (!pipeline || !(pipeline.length > 0)) {
    return;
  }
  const { interpolateFunc, variables, pipelines } = state;
  if (pipelines && Object.keys(pipelines).length) {
    pipeline = dereferencePipelines(pipeline, pipelines);
  }
  if (interpolateFunc && variables && Object.keys(variables).length) {
    const columnTypes = _fromPairs(state.dataset.headers.map(col => [col.name, col.type]));
    const interpolator = new PipelineInterpolator(interpolateFunc, variables, columnTypes);
    pipeline = interpolator.interpolate(pipeline);
  }
  return pipeline;
}
