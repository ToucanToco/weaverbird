/**
 * exports the list of store getters.
 */
import fromPairs from 'lodash/fromPairs';

import type { BackendError, BackendWarning } from '@/lib/backend';
import { getTranslator } from '@/lib/translators';

import type { VQBState } from './state';
import { activePipeline, currentPipeline, inactivePipeline } from './state';
import type { DataSetColumn, DataSetColumnType, Pipeline, PipelineStep } from '@/types';
import type { PipelineStepName } from '@/lib/steps';
import type { PiniaGetterAdaptor, VQBStore } from './types';

type PropMap<T> = { [prop: string]: T };

export type VQBGetters = {
  unsupportedSteps: PipelineStepName[];
  supportedSteps: PipelineStepName[];
  pipelinesNames: string[];
  availableDatasetNames: string[];
  pipeline: Pipeline | undefined;
  activePipeline: PipelineStep[] | undefined;
  inactivePipeline: PipelineStep[] | undefined;
  isPipelineEmpty: boolean | undefined;
  thereIsABackendError: boolean;
  isDatasetEmpty: boolean;
  pageNumber: number;
  previewSourceRowsSubset: number | 'unlimited' | undefined;
  columnNames: string[];
  columnHeaders: DataSetColumn[];
  columnTypes: PropMap<DataSetColumnType | undefined>;
  computedActiveStepIndex: number | undefined;
  domainStep: PipelineStep | undefined;
  isEditingStep: boolean;
  isStepDisabled: (index: number) => boolean;
  stepConfig: (index: number) => PipelineStep | undefined;
  stepErrors: (index: number) => string | undefined;
};

const getters: PiniaGetterAdaptor<VQBGetters, VQBStore> = {
  unsupportedSteps: (state: VQBState) => getTranslator(state.translator).unsupportedSteps,
  supportedSteps: (state: VQBState) => getTranslator(state.translator).supportedSteps,
  pipelinesNames: (state: VQBState) => Object.keys(state.pipelines),
  // Return all available dataset (including pipelines but excluding currentPipelineName)
  availableDatasetNames: (state: VQBState) => {
    const pipelineNames = Object.keys(state.pipelines)
      .filter((name: string) => name !== state.currentPipelineName)
      .sort((a, b) => a.localeCompare(b));
    const domainNames = [...state.domains].sort((a, b) => a.localeCompare(b));
    return [...pipelineNames, ...domainNames];
  },
  pipeline: (state: VQBState) => currentPipeline(state),
  activePipeline: (state: VQBState) => activePipeline(state), // the part of the pipeline that is currently selected.
  inactivePipeline: (state: VQBState) => inactivePipeline(state), // the part of the pipeline that is currently disabled.
  // True if pipeline is empty or only contain a domain step.
  isPipelineEmpty(state: VQBState) {
    const pipeline = currentPipeline(state);
    return !pipeline ? undefined : pipeline.length <= 1;
  },
  thereIsABackendError: (state: VQBState) => state.backendMessages.length > 0,
  isDatasetEmpty: (state: VQBState) => state.dataset.data.length === 0,
  pageNumber: (state: VQBState) =>
    state.dataset.paginationContext ? state.dataset.paginationContext.pageNumber : 1,
  previewSourceRowsSubset: (state: VQBState) => state.dataset.previewContext?.sourceRowsSubset,
  columnNames: (state: VQBState) => state.dataset.headers.map((col) => col.name),
  columnHeaders: (state: VQBState) => state.dataset.headers,
  columnTypes: (state: VQBState) =>
    fromPairs(state.dataset.headers.map((col) => [col.name, col.type])),
  // a direct "usable" index (i.e. convert "-1" to a positive one) of last active step.
  computedActiveStepIndex(state: VQBState) {
    const pipeline = currentPipeline(state);
    if (!pipeline) return;
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
    return !pipeline ? undefined : pipeline?.[0];
  },
  isEditingStep: (state: VQBState) => state.currentStepFormName !== undefined,
  // True if this step is not the domain step & after the last currently active step
  isStepDisabled: (state: VQBState) => (index: number) =>
    state.selectedStepIndex >= 0 && index > state.selectedStepIndex,
  // Get the step config of the pipeline based on its index
  stepConfig: (state: VQBState) => (index: number) => currentPipeline(state)?.[index],
  // Filter errors to retrieve step ones based on its index
  stepErrors: (state: VQBState) => (index: number) => {
    const error = [...state.backendMessages].find(
      (e: BackendError | BackendWarning) => e.type === 'error' && e.index === index,
    );
    return error?.message;
  },
};

export default getters;
