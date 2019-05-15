import { VQBState } from './state';

// provide types for each possible mutations' payloads
type DatasetMutation = {
  type: 'setDataset';
  payload: Pick<VQBState, 'dataset'>;
};

type DomainsMutation = {
  type: 'setDomains';
  payload: Pick<VQBState, 'domains'>;
};

type PipelineMutation = {
  type: 'setPipeline';
  payload: Pick<VQBState, 'pipeline'>;
};

type SelectDomainMutation = {
  type: 'setCurrentDomain';
  payload: Pick<VQBState, 'currentDomain'>;
};

type SelectedStepMutation = {
  type: 'selectStep';
  payload: { index: number };
};

export type StateMutation =
  | DatasetMutation
  | DomainsMutation
  | PipelineMutation
  | SelectDomainMutation
  | SelectedStepMutation;

export default {
  /**
   * set currently last selected step index.
   */
  selectStep(state: VQBState, { index }: { index: number }) {
    state.selectedStepIndex = index;
  },
  /**
   * change current selected domain and reset pipeline accordingly.
   */
  setCurrentDomain(state: VQBState, { currentDomain }: Pick<VQBState, 'currentDomain'>) {
    state.currentDomain = currentDomain;
  },
  /**
   * set the list of available domains.
   */
  setDomains(state: VQBState, { domains }: Pick<VQBState, 'domains'>) {
    state.domains = domains;
    state.currentDomain = domains.length ? domains[0] : undefined;
  },
  /**
   * update pipeline.
   */
  setPipeline(state: VQBState, { pipeline }: Pick<VQBState, 'pipeline'>) {
    state.pipeline = pipeline;
  },
  /**
   * update dataset.
   */
  setDataset(state: VQBState, { dataset }: Pick<VQBState, 'dataset'>) {
    state.dataset = dataset;
  },
};
