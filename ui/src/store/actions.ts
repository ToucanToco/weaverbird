import Vue from 'vue';

import type { BackendError, BackendResponse, BackendService, BackendWarning } from '@/lib/backend';
import { addLocalUniquesToDataset, updateLocalUniquesFromDatabase } from '@/lib/dataset/helpers';
import { pageOffset } from '@/lib/dataset/pagination';
import type { Pipeline, PipelineStep, PipelineStepName } from '@/lib/steps';
import { setVariableDelimiters } from '@/lib/translators';
import type { DataSet, VariableDelimiters, VariablesBucket } from '@/types';

import { currentPipeline } from './state';
import type { PiniaActionAdaptor, VQBStore } from './types';

export type VQBActions = {
  setLoading: ({
    type,
    isLoading,
  }: {
    type: 'dataset' | 'uniqueValues';
    isLoading: boolean;
  }) => void;
  setTranslator: ({ translator }: { translator: string }) => void;
  setBackendService: ({ backendService }: { backendService: BackendService }) => void;
  logBackendMessages: ({
    backendMessages,
  }: {
    backendMessages: BackendError[] | BackendWarning[];
  }) => void;
  setPreviewSourceRowsSubset: ({
    previewSourceRowsSubset,
  }: {
    previewSourceRowsSubset?: number | 'unlimited';
  }) => void;
  toggleRequestOnGoing: ({ isRequestOnGoing }: { isRequestOnGoing: boolean }) => void;
  setAvailableVariables: ({
    availableVariables,
  }: {
    availableVariables: VariablesBucket | undefined;
  }) => void;
  setVariableDelimiters: ({
    variableDelimiters,
  }: {
    variableDelimiters: VariableDelimiters | undefined;
  }) => void;
  setDomains: ({ domains }: { domains: string[] }) => void;
  setAvailableDomains: ({
    availableDomains,
  }: {
    availableDomains: { name: string; uid: string }[];
  }) => void;
  setCurrentPipelineName: ({ name }: { name: string }) => void;
  setPipeline: ({ pipeline }: { pipeline: Pipeline }) => void;
  setPipelines: ({ pipelines }: { pipelines: Record<string, Pipeline> }) => void;
  selectPipeline: ({ name }: { name: string }) => void;
  closeStepForm: () => void;
  createStepForm: ({
    stepName,
    stepFormDefaults,
  }: {
    stepName: PipelineStepName;
    stepFormDefaults?: object;
  }) => void;
  openStepForm: ({
    stepName,
    initialValue,
  }: {
    stepName: PipelineStepName;
    initialValue: object;
  }) => void;
  resetStepFormInitialValue: () => void;
  addSteps: ({ steps }: { steps: PipelineStep[] }) => void;
  deleteSteps: ({ indexes }: { indexes: number[] }) => void;
  selectStep: ({ index }: { index: number }) => void;
  updateDataset: () => Promise<BackendResponse<DataSet> | undefined>;
  setDataset: ({ dataset }: { dataset: DataSet }) => void;
  setSelectedColumns: ({ column }: { column: string | undefined }) => void;
  toggleColumnSelection: ({ column }: { column: string }) => void;
  getColumnNamesFromPipeline: (pipelineNameOrDomain: string) => Promise<string[] | undefined>;
  loadColumnUniqueValues: ({ column }: { column: string }) => void;
  setCurrentPage: ({ pageNumber }: { pageNumber: number }) => void;
  resetPagination: () => void;
};

// format error to fit BackendError interface props
export function formatError(error: any): BackendError {
  return typeof error === 'string'
    ? { type: 'error', message: error.toString() }
    : { type: 'error', ...error };
}

const actions: PiniaActionAdaptor<VQBActions, VQBStore> = {
  setLoading({ type, isLoading }) {
    this.isLoading[type] = isLoading;
  },
  setTranslator({ translator }) {
    this.translator = translator;
  },
  setBackendService({ backendService }) {
    this.backendService = backendService;
  },
  logBackendMessages({ backendMessages }) {
    this.backendMessages = backendMessages;
  },
  setPreviewSourceRowsSubset({ previewSourceRowsSubset }) {
    if (this.dataset.previewContext) {
      this.dataset.previewContext.sourceRowsSubset = previewSourceRowsSubset;
    }
  },
  /**
   * toggle the `isRequestOnGoing` state property
   * meant to be used by `backendify` plugin function.
   */
  toggleRequestOnGoing({ isRequestOnGoing }) {
    this.isRequestOnGoing = isRequestOnGoing;
  },
  // VARIABLES
  setAvailableVariables({ availableVariables }) {
    this.availableVariables = availableVariables;
  },
  setVariableDelimiters({ variableDelimiters }) {
    this.variableDelimiters = variableDelimiters;
    // Forward them to translators
    setVariableDelimiters(variableDelimiters);
  },
  // DOMAINS & PIPELINES
  setDomains({ domains }) {
    this.domains = domains;
  },
  setAvailableDomains({ availableDomains }) {
    this.availableDomains = availableDomains;
  },
  setCurrentPipelineName({ name }) {
    this.currentPipelineName = name;
    this.resetPagination();
  },
  setPipeline({ pipeline }) {
    if (this.currentPipelineName === undefined) {
      return;
    }
    Vue.set(this.pipelines, this.currentPipelineName, pipeline);
    this.resetPagination();
  },
  setPipelines({ pipelines }) {
    this.pipelines = pipelines;
  },
  async selectPipeline({ name }) {
    this.setCurrentPipelineName({ name });
    // // Reset selected step to last one
    this.selectStep({ index: -1 });

    // // Update the preview
    this.updateDataset();
  },
  // STEPS
  /**
   * open step form when creating a step
   */
  createStepForm({ stepName, stepFormDefaults }) {
    this.currentStepFormName = stepName;
    this.stepFormInitialValue = undefined;
    this.stepFormDefaults = stepFormDefaults;
  },
  /**
   * open step form when editing a step
   */
  openStepForm({ stepName, initialValue }) {
    this.stepFormInitialValue = { ...initialValue };
    this.currentStepFormName = stepName;
    this.stepFormDefaults = undefined;
  },
  closeStepForm() {
    this.currentStepFormName = undefined;
  },
  resetStepFormInitialValue() {
    this.stepFormInitialValue = undefined;
  },
  addSteps({ steps }) {
    const pipeline = currentPipeline(this.$state);
    if (this.currentPipelineName === undefined || pipeline === undefined) {
      return;
    }
    const newPipeline = Array.from(pipeline);
    // add steps just after selected steps
    // but always after domain
    const addIndex = this.selectedStepIndex >= 0 ? this.selectedStepIndex + 1 : 1;
    newPipeline.splice(addIndex, 0, ...steps);
    this.pipelines[this.currentPipelineName] = newPipeline;
    const lastAddedStepIndex = addIndex + steps.length - 1;
    // select last added step
    this.selectedStepIndex = lastAddedStepIndex;
    this.resetPagination();
    this.updateDataset();
  },
  deleteSteps({ indexes }: { indexes: number[] }) {
    const pipeline = currentPipeline(this.$state);
    if (this.currentPipelineName === undefined || pipeline === undefined) {
      return;
    }
    const pipelineWithDeletedSteps = pipeline.filter(
      (_: PipelineStep, index: number) => indexes.indexOf(index) === -1,
    );
    this.pipelines[this.currentPipelineName] = pipelineWithDeletedSteps;
    this.selectedStepIndex = pipelineWithDeletedSteps.length - 1;
    this.resetPagination();
    this.updateDataset();
  },
  selectStep({ index }) {
    const pipeline = currentPipeline(this.$state);
    if (pipeline && index > pipeline.length) {
      console.error('In selectStep: index out of bounds. Falling back to last selectable index.');
      this.selectedStepIndex = -1;
    } else {
      this.selectedStepIndex = index;
    }
    this.resetPagination();
  },
  // DATASET
  setDataset({ dataset }) {
    this.dataset = dataset;
  },
  async updateDataset(): Promise<BackendResponse<DataSet> | undefined> {
    this.logBackendMessages({ backendMessages: [] });
    try {
      this.setLoading({ type: 'dataset', isLoading: true });
      this.toggleRequestOnGoing({ isRequestOnGoing: true });
      // No pipeline or an empty pipeline
      if (!this.activePipeline?.length) {
        // Reset preview to an empty state
        this.setDataset({
          dataset: {
            headers: [],
            data: [],
          },
        });
        return;
      }
      const response = await this.backendService.executePipeline(
        this.activePipeline,
        this.pipelines,
        this.pagesize,
        pageOffset(this.pagesize, this.pageNumber),
        this.previewSourceRowsSubset,
      );
      const translator = response.translator ?? 'mongo50'; // mongo50 is not send by backend
      this.setTranslator({ translator });
      const backendMessages = response.error || response.warning || [];
      this.logBackendMessages({ backendMessages });
      if (response.data) {
        this.setDataset({
          dataset: addLocalUniquesToDataset(response.data),
        });
      }
      return response;
    } catch (error) {
      /* istanbul ignore next */
      const response = { error: [formatError(error)] };
      // Avoid spamming tests results with errors, but could be useful in production
      /* istanbul ignore next */
      if (import.meta.env.DEV) {
        console.error(error);
      }
      /* istanbul ignore next */
      this.logBackendMessages({
        backendMessages: response.error,
      });
      /* istanbul ignore next */
      throw error;
    } finally {
      this.toggleRequestOnGoing({ isRequestOnGoing: false });
      this.setLoading({ type: 'dataset', isLoading: false });
    }
  },
  // COLUMNS
  setSelectedColumns({ column }) {
    if (column !== undefined) {
      this.selectedColumns = [column];
    }
  },
  toggleColumnSelection({ column }) {
    if (this.selectedColumns.includes(column)) {
      this.selectedColumns = [];
    } else {
      this.selectedColumns = [column];
    }
  },
  // Retrieve the first row from a pipeline, so we can infer its columns names
  async getColumnNamesFromPipeline(pipelineNameOrDomain) {
    if (!pipelineNameOrDomain) {
      return;
    }

    let pipeline: Pipeline = [];

    if (pipelineNameOrDomain in this.pipelines) {
      pipeline = this.pipelines[pipelineNameOrDomain];
    } else {
      pipeline = [
        {
          name: 'domain',
          domain: pipelineNameOrDomain,
        },
      ];
    }

    const response = await this.backendService.executePipeline(pipeline, this.pipelines, 1, 0);

    if (response.data) {
      return response.data.headers.map((col) => col.name);
    }
  },
  /**
   * Call backend with a special pipeline to retrieve unique values of the requested column.
   * The current pipeline is completed with a "count aggregation" on the requested column.
   * The result is loaded in store.
   */
  async loadColumnUniqueValues({ column }) {
    this.setLoading({ type: 'uniqueValues', isLoading: true });
    try {
      if (!this.activePipeline || !this.activePipeline.length) {
        return;
      }
      const loadUniqueValuesPipeline: Pipeline = [
        ...this.activePipeline,
        {
          name: 'aggregate',
          aggregations: [
            {
              columns: [column],
              aggfunction: 'count',
              newcolumns: ['__vqb_count__'],
            },
          ],
          on: [column],
        },
      ];

      const response = await this.backendService.executePipeline(
        loadUniqueValuesPipeline,
        this.pipelines,
      );
      if (!response.error) {
        this.setDataset({
          dataset: updateLocalUniquesFromDatabase(this.dataset, response.data),
        });
      }
    } finally {
      this.setLoading({ type: 'uniqueValues', isLoading: false });
    }
  },
  // PAGINATION
  setCurrentPage({ pageNumber }) {
    if (this.dataset.paginationContext) {
      this.dataset.paginationContext.pageNumber = pageNumber;
    } else {
      const length = this.dataset.data.length;
      this.dataset.paginationContext = {
        shouldPaginate: false,
        pageNumber,
        pageSize: length,
        totalCount: length,
        isLastPage: true,
      };
    }
    this.updateDataset();
  },
  resetPagination() {
    if (this.dataset.paginationContext) {
      this.dataset.paginationContext.pageNumber = 1;
    }
  },
};

export default actions;
