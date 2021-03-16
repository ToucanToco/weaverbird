/**
 * define what the application state looks like.
 */
import { BackendError, BackendService, BackendWarning, UnsetBackendService } from '@/lib/backend';
import { DataSet } from '@/lib/dataset';
import { Pipeline, PipelineStepName } from '@/lib/steps';
import { InterpolateFunction, ScopeContext } from '@/lib/templating';
import { VariableDelimiters, VariablesBucket } from '@/lib/variables';

export interface VQBState {
  /**
   * available variables for templating
   */
  availableVariables?: VariablesBucket;
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
   * error/warning messages send by backend or catch from its interface
   */
  backendMessages: BackendError[] | BackendWarning[];

  /**
   * An object containing all loading state
   * `dataset` if the whole dataset is loading
   * `uniqueValues` unique values of a column are loading
   */
  isLoading: {
    dataset: boolean;
    uniqueValues: boolean;
  };

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
  /**
   * Backend service: contains the necessary methods to preview pipeline results and fetch available data collections
   */
  backendService: BackendService;
  /**
   * variable delimiter for templating
   */
  variableDelimiters?: VariableDelimiters;
  featureFlags?: Record<string, boolean | string | undefined>;
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
    backendMessages: [],
    isLoading: { dataset: false, uniqueValues: false },
    isRequestOnGoing: false,
    variables: {},
    translator: 'mongo40',
    backendService: UnsetBackendService,
    interpolateFunc: (x: string | any[], _context: ScopeContext) => x,
    featureFlags: undefined,
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
