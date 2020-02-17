/**
 * exports the list of store mutations.
 */

import { BackendError } from '@/lib/backend-response';
import { DomainStep, Pipeline, PipelineStepName } from '@/lib/steps';

import { VQBState } from './state';

// provide types for each possible mutations' payloads
type BackendErrorMutation = {
  type: 'logBackendError';
  payload: BackendError;
};

type DatasetMutation = {
  type: 'setDataset';
  payload: Pick<VQBState, 'dataset'>;
};

type DeleteStepMutation = {
  type: 'deleteStep';
  payload: { index: number };
};

type DomainsMutation = {
  type: 'setDomains';
  payload: Pick<VQBState, 'domains'>;
};

type PipelineMutation = {
  type: 'setPipeline';
  payload: { pipeline: Pipeline };
};

type SetCurrentPipelineNameMutation = {
  type: 'setCurrentPipelineName';
  payload: { name: string };
};

type SelectDomainMutation = {
  type: 'setCurrentDomain';
  payload: Pick<VQBState, 'currentDomain'>;
};

type SelectedStepMutation = {
  type: 'selectStep';
  payload: { index: number };
};

type SelectedColumnsMutation = {
  type: 'setSelectedColumns';
  payload: { column: string };
};

type SetCurrentPage = {
  type: 'setCurrentPage';
  payload: { pageno: number };
};

type ToggleColumnSelectionMutation = {
  type: 'toggleColumnSelection';
  payload: { column: string };
};

export type StateMutation =
  | BackendErrorMutation
  | DatasetMutation
  | DeleteStepMutation
  | DomainsMutation
  | PipelineMutation
  | SetCurrentPipelineNameMutation
  | SelectedColumnsMutation
  | SelectDomainMutation
  | SelectedStepMutation
  | SetCurrentPage
  | ToggleColumnSelectionMutation;

type MutationByType<M, MT> = M extends { type: MT } ? M : never;
export type MutationCallbacks = {
  [K in StateMutation['type']]: (payload: MutationByType<StateMutation, K>['payload']) => void;
};

export default {
  /**
   * unset currentStepFormName in order to close step form
   */
  closeStepForm(state: VQBState) {
    state.currentStepFormName = undefined;
  },
  /**
   * open step form when creating a step
   */
  createStepForm(
    state: VQBState,
    { stepName, stepFormDefaults }: { stepName: PipelineStepName; stepFormDefaults?: object },
  ) {
    state.currentStepFormName = stepName;
    state.stepFormInitialValue = undefined;
    state.stepFormDefaults = stepFormDefaults;
  },

  /**
   * log a backend error message.
   */
  logBackendError(state: VQBState, { backendError }: { backendError: BackendError }) {
    state.backendErrors.push(backendError);
  },

  /**
   * open step form when editing a step
   */
  openStepForm(
    state: VQBState,
    { stepName, initialValue }: { stepName: PipelineStepName; initialValue: object },
  ) {
    state.stepFormInitialValue = { ...initialValue };
    state.currentStepFormName = stepName;
    state.stepFormDefaults = undefined;
  },

  /**
   * empty error log on VQB's state
   */
  resetBackendErrors(state: VQBState) {
    state.backendErrors = [];
  },

  /**
   * reset step form initial value
   */
  resetStepFormInitialValue(state: VQBState) {
    state.stepFormInitialValue = undefined;
  },

  /**
   * set currently last selected step index.
   */
  selectStep(state: VQBState, { index }: { index: number }) {
    if (index > state.pipelines[state.currentPipelineName].length) {
      console.error('In selectStep: index out of bounds. Falling back to last selectable index.');
      state.selectedStepIndex = -1;
    } else {
      state.selectedStepIndex = index;
    }
  },
  /**
   * Delete the step of index `index` in pipeline.
   */
  deleteStep(state: VQBState, { index }: { index: number }) {
    state.pipelines[state.currentPipelineName].splice(index, 1);
    state.selectedStepIndex = index - 1;
  },
  /**
   * change current selected domain and reset pipeline accordingly.
   */
  setCurrentDomain(state: VQBState, { currentDomain }: Pick<VQBState, 'currentDomain'>) {
    state.currentDomain = currentDomain;
    if (currentDomain) {
      const pipeline = state.pipelines[state.currentPipelineName];
      const domainStep: DomainStep = { name: 'domain', domain: currentDomain };
      if (pipeline.length) {
        state.pipelines[state.currentPipelineName] = [domainStep, ...pipeline.slice(1)];
      } else {
        state.pipelines[state.currentPipelineName] = [domainStep];
      }
    }
  },
  /**
   * update currentPipelineName.
   */
  setCurrentPipelineName(state: VQBState, { name }: { name: string }) {
    state.currentPipelineName = name;
  },
  /**
   * update dataset.
   */
  setDataset(state: VQBState, { dataset }: Pick<VQBState, 'dataset'>) {
    state.dataset = dataset;
  },
  /**
   * set the list of available domains.
   */
  setDomains(state: VQBState, { domains }: Pick<VQBState, 'domains'>) {
    state.domains = domains;
    if (!state.currentDomain || (domains.length && !domains.includes(state.currentDomain))) {
      state.currentDomain = domains[0];
    }
  },
  /**
   * update pipeline.
   */
  setPipeline(state: VQBState, { pipeline }: { pipeline: Pipeline }) {
    state.pipelines[state.currentPipelineName] = pipeline;
    if (pipeline.length) {
      const firstStep = pipeline[0];
      if (firstStep.name === 'domain') {
        state.currentDomain = firstStep.domain;
      }
    }
  },
  /**
   * update pipelines.
   */
  setPipelines(state: VQBState, { pipelines }: Pick<VQBState, 'pipelines'>) {
    state.pipelines = pipelines;
  },
  /**
   *
   * set selected columns
   */
  setSelectedColumns(state: VQBState, { column }: { column: string | undefined }) {
    if (column !== undefined) {
      state.selectedColumns = [column];
    }
  },

  /**
   * toggle column selection
   */
  toggleColumnSelection(state: VQBState, { column }: { column: string }) {
    if (state.selectedColumns.includes(column)) {
      state.selectedColumns = [];
    } else {
      state.selectedColumns = [column];
    }
  },

  /**
   * change current pagination context's page
   */
  setCurrentPage(state: VQBState, { pageno }: { pageno: number }) {
    if (state.dataset.paginationContext) {
      state.dataset.paginationContext.pageno = pageno;
    } else {
      const length = state.dataset.data.length;
      state.dataset.paginationContext = { pageno, pagesize: length, totalCount: length };
    }
  },

  /**
   * toggle loading
   */
  setLoading(state: VQBState, { isLoading }: { isLoading: boolean }) {
    state.isLoading = isLoading;
  },

  /**
   * Update translator.
   */
  setTranslator(state: VQBState, { translator }: Pick<VQBState, 'translator'>) {
    state.translator = translator;
  },
};
