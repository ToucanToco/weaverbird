import { Store, StoreOptions } from 'vuex';

import { DataSet } from '@/lib/dataset';
import { Pipeline } from '@/lib/steps';

export interface VQBState {
  dataset: DataSet;
  domains: Array<string>;
  currentDomain?: string;
  selectedStepIndex: number;
  pipeline: Pipeline;
}

export function firstNonSelectedIndex(state: VQBState) {
  const { pipeline, selectedStepIndex } = state;
  if (selectedStepIndex < 0) {
    return pipeline.length;
  }
  return selectedStepIndex + 1;
}

export function activePipeline(state: VQBState) {
  return state.pipeline.slice(0, firstNonSelectedIndex(state));
}

export function disabledPipeline(state: VQBState) {
  return state.pipeline.slice(firstNonSelectedIndex(state));
}

const emptyState: VQBState = {
  dataset: {
    headers: [],
    data: [],
  },
  domains: [],
  selectedStepIndex: -1,
  pipeline: [],
};

export function setupStore(initialState: Partial<VQBState> = {}) {
  const store: StoreOptions<VQBState> = {
    state: { ...emptyState, ...initialState },
    getters: {
      domainStep: state => state.pipeline[0],
      stepsWithoutDomain: state => state.pipeline.slice(1),
      activePipeline,
      disabledPipeline,
      isPipelineEmpty: state => state.pipeline.length === 1,
      isDatasetEmpty: state => state.dataset.data.length === 1,
      isStepDisabled: state => (index: number) =>
        state.selectedStepIndex >= 0 && index > state.selectedStepIndex,
      columnNames: state => state.dataset.headers.map(col => col.name),
    },
    mutations: {
      selectStep(state, { index }: { index: number }) {
        state.selectedStepIndex = index;
      },
      setCurrentDomain(state, { currentDomain }: Pick<VQBState, 'currentDomain'>) {
        state.currentDomain = currentDomain;
      },
      setDomains(state, { domains }: Pick<VQBState, 'domains'>) {
        state.domains = domains;
        state.currentDomain = domains.length ? domains[0] : undefined;
      },
      setPipeline(state, { pipeline }: Pick<VQBState, 'pipeline'>) {
        state.pipeline = pipeline;
      },
      setDataset(state, { dataset }: Pick<VQBState, 'dataset'>) {
        state.dataset = dataset;
      },
    },
  };
  return new Store<VQBState>(store);
}
