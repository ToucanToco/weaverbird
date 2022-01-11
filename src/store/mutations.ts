/**
 * exports the list of store mutations.
 */

import Vue from 'vue';
import { MutationTree } from 'vuex';

import { BackendError, BackendWarning } from '@/lib/backend';
import { DomainStep, Pipeline, PipelineStep, PipelineStepName } from '@/lib/steps';
import { setVariableDelimiters } from '@/lib/translators';

import { currentPipeline, VQBState } from './state';

// provide types for each possible mutations' payloads
type BackendMessageMutation = {
  type: 'logBackendMessages';
  payload: BackendError[] | BackendWarning[];
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

type SetPreviewSourceRowsSubset = {
  type: 'setPreviewSourceRowsSubset';
  payload: { previewSourceRowsSubset?: number | 'unlimited' };
};

type ToggleColumnSelectionMutation = {
  type: 'toggleColumnSelection';
  payload: { column: string };
};

type ToggleRequestOnGoing = {
  type: 'toggleRequestOnGoing';
  payload: BackendError;
};

type AvailableVariablesMutation = {
  type: 'setAvailableVariables';
  payload: Pick<VQBState, 'availableVariables'>;
};

type VariableDelimitersMutation = {
  type: 'setVariableDelimiters';
  payload: Pick<VQBState, 'variableDelimiters'>;
};

export type StateMutation =
  | AvailableVariablesMutation
  | BackendMessageMutation
  | DatasetMutation
  | DeleteStepMutation
  | DomainsMutation
  | PipelineMutation
  | SetCurrentPipelineNameMutation
  | SelectedColumnsMutation
  | SelectDomainMutation
  | SelectedStepMutation
  | SetCurrentPage
  | SetPreviewSourceRowsSubset
  | ToggleColumnSelectionMutation
  | ToggleRequestOnGoing
  | VariableDelimitersMutation;

type MutationByType<M, MT> = M extends { type: MT } ? M : never;
export type MutationCallbacks = {
  [K in StateMutation['type']]: (payload: MutationByType<StateMutation, K>['payload']) => void;
};

/**
 * Mutation wrapper so that the pagination is reset at the end of the mutation
 */
function resetPagination(_target: any, _propertyKey: string, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value;

  descriptor.value = function(state: VQBState, ...args: any[]) {
    originalMethod(state, ...args);
    if (state.dataset.paginationContext) {
      state.dataset.paginationContext.pageno = 1;
    }
  };

  return descriptor;
}

/**
 * HACK: this class is just a temporary wrapper to be able to use decorators.
 * We'll export its prototype afterwards.
 */
class Mutations {
  setTranslator(state: VQBState, { translator }: Pick<VQBState, 'translator'>) {
    state.translator = translator;
  }

  // BACKEND SERVICE & PREVIEW

  setBackendService(state: VQBState, { backendService }: Pick<VQBState, 'backendService'>) {
    state.backendService = backendService;
  }

  /**
   * toggle the `isRequestOnGoing` state property
   * meant to be used by `backendify` plugin function.
   */
  toggleRequestOnGoing(state: VQBState, { isRequestOnGoing }: { isRequestOnGoing: boolean }) {
    state.isRequestOnGoing = isRequestOnGoing;
  }

  setLoading(
    state: VQBState,
    { type, isLoading }: { type: 'dataset' | 'uniqueValues'; isLoading: boolean },
  ) {
    state.isLoading[type] = isLoading;
  }

  logBackendMessages(
    state: VQBState,
    { backendMessages }: { backendMessages: BackendError[] | BackendWarning[] },
  ) {
    state.backendMessages = backendMessages;
  }

  setDataset(state: VQBState, { dataset }: Pick<VQBState, 'dataset'>) {
    state.dataset = dataset;
  }

  setCurrentPage(state: VQBState, { pageno }: { pageno: number }) {
    if (state.dataset.paginationContext) {
      state.dataset.paginationContext.pageno = pageno;
    } else {
      const length = state.dataset.data.length;
      state.dataset.paginationContext = { pageno, pagesize: length, totalCount: length };
    }
  }

  setPreviewSourceRowsSubset(
    state: VQBState,
    { previewSourceRowsSubset }: { previewSourceRowsSubset?: number | 'unlimited' },
  ) {
    if (state.dataset.previewContext) {
      state.dataset.previewContext.sourceRowsSubset = previewSourceRowsSubset;
    }
  }

  // VARIABLES

  setAvailableVariables(
    state: VQBState,
    { availableVariables }: Pick<VQBState, 'availableVariables'>,
  ) {
    state.availableVariables = availableVariables;
  }

  setVariableDelimiters(
    state: VQBState,
    { variableDelimiters }: Pick<VQBState, 'variableDelimiters'>,
  ) {
    state.variableDelimiters = variableDelimiters;

    // Forward them to translators
    setVariableDelimiters(variableDelimiters);
  }

  // DOMAINS & PIPELINES

  setDomains(state: VQBState, { domains }: Pick<VQBState, 'domains'>) {
    state.domains = domains;
    if (!state.currentDomain || (domains.length && !domains.includes(state.currentDomain))) {
      state.currentDomain = domains[0];
    }
  }

  @resetPagination
  setPipeline(state: VQBState, { pipeline }: { pipeline: Pipeline }) {
    if (state.currentPipelineName === undefined) {
      return;
    }
    Vue.set(state.pipelines, state.currentPipelineName, pipeline);
    if (pipeline.length) {
      const firstStep = pipeline[0];
      if (firstStep.name === 'domain') {
        state.currentDomain = firstStep.domain;
      }
    }
  }

  setPipelines(state: VQBState, { pipelines }: Pick<VQBState, 'pipelines'>) {
    state.pipelines = pipelines;
  }

  @resetPagination
  setCurrentPipelineName(state: VQBState, { name }: { name: string }) {
    state.currentPipelineName = name;
  }

  // STEPS & COLUMNS

  closeStepForm(state: VQBState) {
    state.currentStepFormName = undefined;
  }
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
  }

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
  }

  resetStepFormInitialValue(state: VQBState) {
    state.stepFormInitialValue = undefined;
  }

  /**
   * set currently last selected step index.
   */
  @resetPagination
  selectStep(state: VQBState, { index }: { index: number }) {
    const pipeline = currentPipeline(state);
    if (pipeline && index > pipeline.length) {
      console.error('In selectStep: index out of bounds. Falling back to last selectable index.');
      state.selectedStepIndex = -1;
    } else {
      state.selectedStepIndex = index;
    }
  }

  @resetPagination
  deleteSteps(state: VQBState, { indexes }: { indexes: number[] }) {
    const pipeline = currentPipeline(state);
    if (state.currentPipelineName === undefined || pipeline === undefined) {
      return;
    }
    const pipelineWithDeletedSteps = pipeline.filter(
      (_: PipelineStep, index: number) => indexes.indexOf(index) === -1,
    );
    state.pipelines[state.currentPipelineName] = pipelineWithDeletedSteps;
    state.selectedStepIndex = pipelineWithDeletedSteps.length - 1;
  }

  @resetPagination
  addSteps(state: VQBState, { steps }: { steps: PipelineStep[] }) {
    const pipeline = currentPipeline(state);
    if (state.currentPipelineName === undefined || pipeline === undefined) {
      return;
    }
    const newPipeline = Array.from(pipeline);
    // add steps just after selected steps
    // but always after domain
    const addIndex = state.selectedStepIndex >= 0 ? state.selectedStepIndex + 1 : 1;
    newPipeline.splice(addIndex, 0, ...steps);
    state.pipelines[state.currentPipelineName] = newPipeline;
    const lastAddedStepIndex = addIndex + steps.length - 1;
    // select last added step
    state.selectedStepIndex = lastAddedStepIndex;
  }

  /**
   * change current selected domain and reset pipeline accordingly.
   */
  @resetPagination
  setCurrentDomain(state: VQBState, { currentDomain }: Pick<VQBState, 'currentDomain'>) {
    const pipeline = currentPipeline(state);
    if (state.currentPipelineName === undefined || pipeline === undefined) {
      return;
    }
    state.currentDomain = currentDomain;
    if (currentDomain) {
      const domainStep: DomainStep = { name: 'domain', domain: currentDomain };
      if (pipeline.length) {
        state.pipelines[state.currentPipelineName] = [domainStep, ...pipeline.slice(1)];
      } else {
        state.pipelines[state.currentPipelineName] = [domainStep];
      }
    }
  }

  setSelectedColumns(state: VQBState, { column }: { column: string | undefined }) {
    if (column !== undefined) {
      state.selectedColumns = [column];
    }
  }

  toggleColumnSelection(state: VQBState, { column }: { column: string }) {
    if (state.selectedColumns.includes(column)) {
      state.selectedColumns = [];
    } else {
      state.selectedColumns = [column];
    }
  }
}

const mutations: MutationTree<VQBState> = {};
Object.assign(mutations, Mutations.prototype);
export default mutations;
