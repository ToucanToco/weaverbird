/**
 * define what the application state looks like.
 */
import { BackendError } from '@/lib/backend-response';
import { DataSet } from '@/lib/dataset';
import { Pipeline, PipelineStepName } from '@/lib/steps';
import { InterpolateFunction, ScopeContext } from '@/lib/templating';

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

  remoteStepForm?: object;

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
   * whether the data is loading
   */
  isLoading: boolean;

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
    remoteStepForm: undefined,
    selectedStepIndex: -1,
    currentPipelineName: undefined,
    pipelines: {},
    selectedColumns: [],
    pagesize: 50,
    backendErrors: [],
    isLoading: false,
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
