/**
 * exports the list of store getters.
 */
import _ from 'lodash';
import { GetterTree } from 'vuex';

import { BackendError, BackendWarning } from '@/lib/backend';
import { getPipelineNamesReferencing } from '@/lib/dereference-pipeline';
import { getTranslator } from '@/lib/translators';

import { activePipeline, currentPipeline, inactivePipeline, VQBState } from './state';

const getters: GetterTree<VQBState, any> = {
  translator: (state: VQBState) => state.translator,
  unsupportedSteps: (state: VQBState) => getTranslator(state.translator).unsupportedSteps,
  supportedSteps: (state: VQBState) => getTranslator(state.translator).supportedSteps,

  pipelines: (state: VQBState) => state.pipelines,
  pipelinesNames: (state: VQBState) => Object.keys(state.pipelines),

  // Return all available dataset (including pipelines but excluding currentPipelineName)
  availableDatasetNames: (state: VQBState) => {
    const pipelineNames = Object.keys(state.pipelines)
      .filter((name: string) => name !== state.currentPipelineName)
      .sort((a, b) => a.localeCompare(b));

    const domainNames = [...state.domains].sort((a, b) => a.localeCompare(b));

    return [...pipelineNames, ...domainNames];
  },

  // Return the pipelines referencing the current pipeline
  referencingPipelines: (state: VQBState) =>
    state.currentPipelineName
      ? getPipelineNamesReferencing(state.currentPipelineName, state.pipelines)
      : [],

  pipeline: (state: VQBState) => currentPipeline(state),
  activePipeline, // the part of the pipeline that is currently selected.
  inactivePipeline, // the part of the pipeline that is currently disabled.

  // True if pipeline is empty or only contain a domain step.
  isPipelineEmpty(state: VQBState) {
    const pipeline = currentPipeline(state);
    if (!pipeline) {
      return;
    }
    return pipeline.length <= 1;
  },

  backendMessages: (state: VQBState) => state.backendMessages,
  thereIsABackendError: (state: VQBState) => state.backendMessages.length > 0,

  isDatasetEmpty: (state: VQBState) => state.dataset.data.length === 0,
  pageno: (state: VQBState) =>
    state.dataset.paginationContext ? state.dataset.paginationContext.pageno : 1,
  previewSourceRowsSubset: (state: VQBState) => state.dataset.previewContext?.sourceRowsSubset,

  columnNames: (state: VQBState) => state.dataset.headers.map(col => col.name),
  columnHeaders: (state: VQBState) => state.dataset.headers,
  columnTypes: (state: VQBState) =>
    _.fromPairs(state.dataset.headers.map(col => [col.name, col.type])),

  //selected columns in the dataviewer (materialized by a styled focus)
  selectedColumns: (state: VQBState) => state.selectedColumns,

  // a direct "usable" index (i.e. convert "-1" to a positive one) of last active step.
  computedActiveStepIndex(state: VQBState) {
    const pipeline = currentPipeline(state);
    if (!pipeline) {
      return;
    }
    const lastStepIndex = pipeline.length - 1;
    return state.selectedStepIndex === -1 || state.selectedStepIndex > lastStepIndex
      ? lastStepIndex
      : state.selectedStepIndex;
  },

  /**
   * the first step of the pipeline. Since it's handled differently in the UI,
   * it's useful to be able to access it directly.
   */
  domainStep(state: VQBState) {
    const pipeline = currentPipeline(state);
    if (!pipeline) {
      return;
    }
    return pipeline?.[0];
  },

  isEditingStep: (state: VQBState) => state.currentStepFormName !== undefined,

  // True if this step is not the domain step & after the last currently active step
  isStepDisabled: (state: VQBState) => (index: number) =>
    state.selectedStepIndex >= 0 && index > state.selectedStepIndex,

  // Get the step config of the pipeline based on its index
  stepConfig: (state: VQBState) => (index: number) => {
    const pipeline = currentPipeline(state);
    return pipeline?.[index];
  },
  // Filter errors to retrieve step ones based on its index
  stepErrors: (state: VQBState) => (index: number) => {
    const error = [...state.backendMessages].find(
      (e: BackendError | BackendWarning) => e.type === 'error' && e.index === index,
    );
    return error?.message;
  },
};

export default getters;
