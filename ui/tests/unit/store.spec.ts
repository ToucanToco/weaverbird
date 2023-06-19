import { type Store, createPinia, setActivePinia } from 'pinia';
import type { Mock } from 'vitest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { BackendService } from '@/lib/backend';
import type { DataSet } from '@/lib/dataset';
import type { Pipeline } from '@/lib/steps';
import { formatError } from '@/store/actions';
import { currentPipeline, emptyState } from '@/store/state';

import { buildState, buildStateWithOnePipeline, setupMockStore } from './utils';

describe('getter tests', () => {
  beforeEach(() => {
    // creates a fresh pinia and make it active so it's automatically picked
    // up by any useStore() call without having to pass it to it:
    // `useStore(pinia)`
    setActivePinia(createPinia());
  });

  describe('pipelines', () => {
    it('should return the pipelines', () => {
      const pipelines = { foo: [], bar: [] };
      const store = setupMockStore(
        buildState({
          pipelines,
        }),
      );
      expect(store.pipelines).toEqual(pipelines);
    });
  });

  describe('(in)active pipeline steps', () => {
    it('should not return anything without any selected pipeline', () => {
      const store = setupMockStore(buildState({}));
      expect(store.activePipeline).toBeUndefined();
      expect(store.inactivePipeline).toBeUndefined();
    });

    it('should return the whole pipeline if selectedIndex is -1', () => {
      const pipeline: Pipeline = [
        { name: 'domain', domain: 'foo' },
        { name: 'rename', toRename: [['foo', 'bar']] },
        { name: 'rename', toRename: [['baz', 'spam']] },
      ];
      const state = buildStateWithOnePipeline(pipeline);
      const store = setupMockStore(state);
      expect(store.activePipeline).toEqual(pipeline);
    });

    it('should return a partial pipeline if selectedIndex is specified', () => {
      const pipeline: Pipeline = [
        { name: 'domain', domain: 'foo' },
        { name: 'rename', toRename: [['foo', 'bar']] },
        { name: 'rename', toRename: [['baz', 'spam']] },
      ];
      const state = buildStateWithOnePipeline(pipeline, { selectedStepIndex: 1 });
      const store = setupMockStore(state);
      expect(store.activePipeline).toEqual(pipeline.slice(0, 2));
    });

    it('should return an empty pipeline if selectedIndex is -1', () => {
      const pipeline: Pipeline = [
        { name: 'domain', domain: 'foo' },
        { name: 'rename', toRename: [['foo', 'bar']] },
        { name: 'rename', toRename: [['baz', 'spam']] },
      ];
      const state = buildStateWithOnePipeline(pipeline);
      const store = setupMockStore(state);
      expect(store.inactivePipeline).toEqual([]);
    });

    it('should return the rest of the pipeline if selectedIndex is specified', () => {
      const pipeline: Pipeline = [
        { name: 'domain', domain: 'foo' },
        { name: 'rename', toRename: [['foo', 'bar']] },
        { name: 'rename', toRename: [['baz', 'spam']] },
      ];
      const state = buildStateWithOnePipeline(pipeline, { selectedStepIndex: 1 });
      const store = setupMockStore(state);
      expect(store.inactivePipeline).toEqual(pipeline.slice(2));
    });
  });

  describe('availableDatasetNames', () => {
    it('should not return the current pipeline', () => {
      const state = buildState({
        currentPipelineName: 'coco_l_asticot',
        pipelines: {
          coco_l_asticot: [],
          dataset1: [],
          dataset2: [],
        },
      });
      const store = setupMockStore(state);
      expect(store.availableDatasetNames).toEqual(['dataset1', 'dataset2']);
    });
    it('should return everything if the currentPipelineName is not defined', () => {
      const state = buildState({
        currentPipelineName: undefined,
        pipelines: {
          dataset1: [],
          dataset2: [],
        },
      });
      const store = setupMockStore(state);
      expect(store.availableDatasetNames).toEqual(['dataset1', 'dataset2']);
    });
    it('should return the pipeline names and the domains', () => {
      const state = buildState({
        pipelines: {
          dataset1: [],
          dataset2: [],
        },
        domains: ['domain1', 'domain2'],
      });
      const store = setupMockStore(state);
      expect(store.availableDatasetNames).toEqual(['dataset1', 'dataset2', 'domain1', 'domain2']);
    });
    it('should sort the result: first pipelines ordered alphabetically, then domains ordered alphabetically', () => {
      const state = buildState({
        pipelines: {
          abc: [],
          xyz: [],
        },
        domains: ['mno', 'dataset1'],
      });
      const store = setupMockStore(state);
      expect(store.availableDatasetNames).toEqual(['abc', 'xyz', 'dataset1', 'mno']);
    });
  });

  describe('active step index tests', () => {
    it('should not return anything if no pipeline is selected', () => {
      const state = buildState({});
      const store = setupMockStore(state);
      expect(store.computedActiveStepIndex).toBeUndefined();
    });

    it('should compute active step index if selectedIndex is -1', () => {
      const pipeline: Pipeline = [
        { name: 'domain', domain: 'foo' },
        { name: 'rename', toRename: [['foo', 'bar']] },
        { name: 'rename', toRename: [['baz', 'spam']] },
      ];
      const state = buildStateWithOnePipeline(pipeline);
      const store = setupMockStore(state);
      expect(store.computedActiveStepIndex).toEqual(2);
    });

    it('should bound active step index if selectedIndex is out of bound', () => {
      // This can happen when we externally load a pipeline smaller than the current one
      // and selectedStepIndex !== -1 because we played with the current pipeline
      const pipeline: Pipeline = [
        { name: 'domain', domain: 'foo' },
        { name: 'rename', toRename: [['foo', 'bar']] },
        { name: 'rename', toRename: [['baz', 'spam']] },
      ];
      const state = buildStateWithOnePipeline(pipeline, { selectedStepIndex: 8396 });
      const store = setupMockStore(state);
      expect(store.computedActiveStepIndex).toEqual(2);
    });

    it('should compute active step index if selectedIndex is specified', () => {
      const pipeline: Pipeline = [
        { name: 'domain', domain: 'foo' },
        { name: 'rename', toRename: [['foo', 'bar']] },
        { name: 'rename', toRename: [['baz', 'spam']] },
      ];
      const state = buildStateWithOnePipeline(pipeline, { selectedStepIndex: 1 });
      const store = setupMockStore(state);
      expect(store.computedActiveStepIndex).toEqual(1);
    });
  });

  describe('column names tests', () => {
    it('should compute column names', () => {
      const state = buildState({
        dataset: {
          headers: [{ name: 'col1' }, { name: 'col2' }],
          data: [],
        },
      });
      const store = setupMockStore(state);
      expect(store.columnNames).toEqual(['col1', 'col2']);
    });

    it('should be able to handle empty headers', () => {
      const state = buildState({
        dataset: {
          headers: [],
          data: [],
        },
      });
      const store = setupMockStore(state);
      expect(store.columnNames).toEqual([]);
    });
  });

  describe('column types tests', () => {
    it('should return column types', () => {
      const state = buildState({
        dataset: {
          headers: [
            { name: 'col1', type: 'integer' },
            { name: 'col2', type: 'boolean' },
            { name: 'col3' },
          ],
          data: [],
        },
      });
      const store = setupMockStore(state);
      const columnTypes = store.columnTypes;
      expect(columnTypes).toEqual({
        col1: 'integer',
        col2: 'boolean',
        col3: undefined,
      });
    });
  });

  describe('domain extraction tests', () => {
    it('should not return anything if no pipeline is selected', function () {
      const state = buildState({});
      const store = setupMockStore(state);
      expect(store.domainStep).toBeUndefined;
    });

    it('should return the domain step', () => {
      const pipeline: Pipeline = [
        { name: 'domain', domain: 'foo' },
        { name: 'rename', toRename: [['foo', 'bar']] },
        { name: 'rename', toRename: [['baz', 'spam']] },
      ];
      const state = buildStateWithOnePipeline(pipeline);
      const store = setupMockStore(state);
      expect(store.domainStep).toEqual(pipeline[0]);
    });
  });

  describe('dataset empty tests', () => {
    it('should return true if dataset is empty', () => {
      const state = buildState({
        dataset: {
          headers: [{ name: 'col1' }, { name: 'col2' }],
          data: [],
        },
      });
      const store = setupMockStore(state);
      expect(store.isDatasetEmpty).toBeTruthy();
    });

    it('should return false if dataset is not empty', () => {
      const state = buildState({
        dataset: {
          headers: [{ name: 'col1' }, { name: 'col2' }],
          data: [[0, 0]],
        },
      });
      const store = setupMockStore(state);
      expect(store.isDatasetEmpty).toBeFalsy();
    });
  });

  describe('pipeline empty tests', () => {
    it('should not return anything if no pipeline is selected', function () {
      const state = buildState({});
      const store = setupMockStore(state);
      expect(store.isPipelineEmpty).toBeUndefined;
    });

    it('should return true if pipeline is empty', () => {
      const pipeline: Pipeline = [];
      const state = buildStateWithOnePipeline(pipeline);
      const store = setupMockStore(state);
      expect(store.isPipelineEmpty).toBeTruthy();
    });

    it('should return false if pipeline is not empty', () => {
      const pipeline: Pipeline = [
        { name: 'domain', domain: 'foo' },
        { name: 'rename', toRename: [['foo', 'bar']] },
        { name: 'rename', toRename: [['baz', 'spam']] },
      ];
      const state = buildStateWithOnePipeline(pipeline);
      const store = setupMockStore(state);
      expect(store.isPipelineEmpty).toBeFalsy();
    });
  });

  describe('step disabled tests', () => {
    it('should return false if selected step is not specified or -1', () => {
      let state = buildState({});
      const store = setupMockStore(state);
      expect(store.isStepDisabled(0)).toBeFalsy();
      expect(store.isStepDisabled(1)).toBeFalsy();
      state = buildState({ selectedStepIndex: -1 });
      expect(store.isStepDisabled(0)).toBeFalsy();
      expect(store.isStepDisabled(1)).toBeFalsy();
    });

    it('should return false if selected step index is greater than index', () => {
      const state = buildState({ selectedStepIndex: 1 });
      const store = setupMockStore(state);
      expect(store.isStepDisabled(0)).toBeFalsy();
      expect(store.isStepDisabled(1)).toBeFalsy();
    });

    it('should return true if selected step index is lower than index', () => {
      const state = buildState({ selectedStepIndex: 1 });
      const store = setupMockStore(state);
      expect(store.isStepDisabled(2)).toBeTruthy();
      expect(store.isStepDisabled(3)).toBeTruthy();
    });
  });

  describe('step configuration', () => {
    it('should retrieve the configuration of a step using its index', function () {
      const pipeline: Pipeline = [
        { name: 'domain', domain: 'foo' },
        { name: 'rename', toRename: [['foo', 'bar']] },
        { name: 'rename', toRename: [['baz', 'spam']] },
      ];
      const state = buildStateWithOnePipeline(pipeline);
      const store = setupMockStore(state);
      expect(store.stepConfig(1)).toEqual(pipeline[1]);
    });

    it('should not return anything if there is no selected pipeline', function () {
      const state = buildState({});
      const store = setupMockStore(state);
      expect(store.stepConfig(0)).toBeUndefined();
    });
  });

  describe('step errors', () => {
    it('should return the error message if step index is found in errors', function () {
      const state = buildState({
        backendMessages: [{ type: 'error', message: 'lalalolilol', index: 3 }],
      });
      const store = setupMockStore(state);
      expect(store.stepErrors(3)).toStrictEqual('lalalolilol');
    });
    it('should return undefined if step index has no errors', function () {
      const state = buildState({
        backendMessages: [{ type: 'error', message: 'lalalolilol', index: 3 }],
      });
      const store = setupMockStore(state);
      expect(store.stepErrors(0)).toBeUndefined();
    });
    it('should return undefined if pipeline has no errors', function () {
      const state = buildState({});
      const store = setupMockStore(state);
      expect(store.stepErrors(0)).toBeUndefined();
    });
  });

  describe('message error related test', () => {
    it('should return false if backendError is undefined', () => {
      const state = buildState({ backendMessages: [] });
      const store = setupMockStore(state);
      expect(store.thereIsABackendError).toBeFalsy();
    });

    it('should return true if backendError is not undefined', () => {
      const state = buildState({ backendMessages: [{ type: 'error', message: 'error msg' }] });
      const store = setupMockStore(state);
      expect(store.thereIsABackendError).toBeTruthy();
    });
  });

  describe('translator', () => {
    it('should return the app translator', () => {
      const state = buildState({ translator: 'mongo40' });
      const store = setupMockStore(state);
      expect(store.translator).toEqual('mongo40');
    });
  });

  describe('unsupportedSteps', () => {
    it('should return the list of steps not supported by the translator', () => {
      const state = buildState({ translator: 'mongo36' });
      const store = setupMockStore(state);
      expect(store.unsupportedSteps).toEqual([
        'convert',
        'customsql',
        'dissolve',
        'hierarchy',
        'replacetext',
        'simplify',
        'trim',
      ]);
    });
  });

  describe('supportedSteps', () => {
    it('should return the list of steps supported by the translator', () => {
      const state = buildState({ translator: 'empty' });
      const store = setupMockStore(state);
      expect(store.supportedSteps).toEqual(['domain']);
    });
  });
});

describe('mutation tests', () => {
  beforeEach(() => {
    // creates a fresh pinia and make it active so it's automatically picked
    // up by any useStore() call without having to pass it to it:
    // `useStore(pinia)`
    setActivePinia(createPinia());
  });
  it('selects step', () => {
    const pipeline: Pipeline = [
      { name: 'domain', domain: 'foo' },
      { name: 'rename', toRename: [['foo', 'bar']] },
      { name: 'rename', toRename: [['baz', 'spam']] },
    ];
    const state = buildStateWithOnePipeline(pipeline, {
      dataset: {
        headers: [],
        data: [],
        paginationContext: {
          shouldPaginate: false,
          pageNumber: 2,
          pageSize: 10,
          totalCount: 10,
          isLastPage: true,
        },
      },
    });
    const store = setupMockStore(state);
    expect(store.selectedStepIndex).toEqual(-1);
    store.selectStep({ index: 2 });
    expect(store.selectedStepIndex).toEqual(2);
    // make sure the pagination is reset
    expect(store.dataset.paginationContext?.pageNumber).toEqual(1);

    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    store.selectStep({ index: 5 });
    expect(spy).toHaveBeenCalled();
    expect(store.selectedStepIndex).toEqual(-1);
    spy.mockRestore();
  });

  describe('deleteSteps', function () {
    it('should do nothing if no pipeline is selected', () => {
      const state = buildState({});
      const store = setupMockStore(state);
      store.deleteSteps({ indexes: [1] });
      expect(currentPipeline(state)).toBeUndefined();
    });

    it('should delete selected steps on an existing pipeline and select the last available one', () => {
      const pipeline: Pipeline = [
        { name: 'domain', domain: 'foo' },
        { name: 'rename', toRename: [['foo', 'bar']] },
        { name: 'rename', toRename: [['baz', 'spam']] },
        { name: 'rename', toRename: [['clou', 'vis']] },
      ];
      const state = buildStateWithOnePipeline(pipeline, {
        dataset: {
          headers: [],
          data: [],
          paginationContext: {
            shouldPaginate: true,
            pageNumber: 2,
            pageSize: 10,
            totalCount: 10,
            isLastPage: true,
          },
        },
      });
      const store = setupMockStore(state);
      store.deleteSteps({ indexes: [1, 3] });
      expect(currentPipeline(store)).toEqual([
        { name: 'domain', domain: 'foo' },
        { name: 'rename', toRename: [['baz', 'spam']] },
      ]);
      expect(store.selectedStepIndex).toEqual(1);
      // make sure the pagination is reset
      expect(store.dataset.paginationContext?.pageNumber).toEqual(1);
    });
  });

  describe('addSteps', function () {
    it('should do nothing if no pipeline is selected', () => {
      const state = buildState({});
      const store = setupMockStore(state);
      store.addSteps({
        steps: [
          { name: 'rename', toRename: [['foo', 'bar']] },
          { name: 'rename', toRename: [['baz', 'spam']] },
        ],
      });
      expect(currentPipeline(state)).toBeUndefined();
    });

    it('should add selected steps to pipeline at selected index and select the last added step', () => {
      const pipeline: Pipeline = [
        { name: 'domain', domain: 'foo' },
        { name: 'rename', toRename: [['foo', 'bar']] },
        { name: 'rename', toRename: [['baz', 'spam']] },
        { name: 'rename', toRename: [['bobo', 'babar']] },
        { name: 'rename', toRename: [['bibi', 'bubu']] },
      ];
      const state = buildStateWithOnePipeline(pipeline, {
        dataset: {
          headers: [],
          data: [],
          paginationContext: {
            shouldPaginate: true,
            pageNumber: 2,
            pageSize: 10,
            totalCount: 10,
            isLastPage: true,
          },
        },
      });
      const store = setupMockStore(state);
      store.selectStep({ index: 2 }); // select step 2
      store.addSteps({
        steps: [
          { name: 'rename', toRename: [['lalalolilol', 'lol']] },
          { name: 'rename', toRename: [['trololol', 'lala']] },
        ],
      });
      expect(currentPipeline(state)).toEqual([
        { name: 'domain', domain: 'foo' },
        { name: 'rename', toRename: [['foo', 'bar']] },
        { name: 'rename', toRename: [['baz', 'spam']] },
        { name: 'rename', toRename: [['lalalolilol', 'lol']] },
        { name: 'rename', toRename: [['trololol', 'lala']] },
        { name: 'rename', toRename: [['bobo', 'babar']] },
        { name: 'rename', toRename: [['bibi', 'bubu']] },
      ]);
      expect(store.selectedStepIndex).toEqual(4);
      // make sure the pagination is reset
      expect(store.dataset.paginationContext?.pageNumber).toEqual(1);
    });

    it('should never add  selected steps before domain step', () => {
      const pipeline: Pipeline = [
        { name: 'domain', domain: 'foo' },
        { name: 'rename', toRename: [['foo', 'bar']] },
        { name: 'rename', toRename: [['baz', 'spam']] },
        { name: 'rename', toRename: [['bobo', 'babar']] },
        { name: 'rename', toRename: [['bibi', 'bubu']] },
      ];
      const state = buildStateWithOnePipeline(pipeline, {
        dataset: {
          headers: [],
          data: [],
          paginationContext: {
            shouldPaginate: true,
            pageNumber: 2,
            pageSize: 10,
            totalCount: 10,
            isLastPage: true,
          },
        },
      });
      const store = setupMockStore(state);
      store.selectStep({ index: -1 }); // select step -1
      store.addSteps({
        steps: [
          { name: 'rename', toRename: [['lalalolilol', 'lol']] },
          { name: 'rename', toRename: [['trololol', 'lala']] },
        ],
      });
      expect(currentPipeline(state)).toEqual([
        { name: 'domain', domain: 'foo' },
        { name: 'rename', toRename: [['lalalolilol', 'lol']] },
        { name: 'rename', toRename: [['trololol', 'lala']] },
        { name: 'rename', toRename: [['foo', 'bar']] },
        { name: 'rename', toRename: [['baz', 'spam']] },
        { name: 'rename', toRename: [['bobo', 'babar']] },
        { name: 'rename', toRename: [['bibi', 'bubu']] },
      ]);
      expect(store.selectedStepIndex).toEqual(2);
      // make sure the pagination is reset
      expect(store.dataset.paginationContext?.pageNumber).toEqual(1);
    });
  });

  it('sets domain list', () => {
    const state = buildState({});
    const store = setupMockStore(state);
    expect(store.domains).toEqual([]);
    store.setDomains({ domains: ['foo', 'bar'] });
    expect(store.domains).toEqual(['foo', 'bar']);
  });

  it('sets availableDomains list', () => {
    const state = buildState({});
    const store = setupMockStore(state);
    expect(store.availableDomains).toEqual([]);
    store.setAvailableDomains({ availableDomains: [{ uid: '1', name: 'Query 1' }] });
    expect(store.availableDomains).toEqual([{ uid: '1', name: 'Query 1' }]);
  });

  it('sets unjoinableDomains list', () => {
    const state = buildState({});
    const store = setupMockStore(state);
    expect(store.unjoinableDomains).toEqual([]);
    store.setUnjoinableDomains({ unjoinableDomains: [{ uid: '1', name: 'Query 1' }] });
    expect(store.unjoinableDomains).toEqual([{ uid: '1', name: 'Query 1' }]);
  });

  it('sets currentPipelineName', () => {
    const state = buildState({
      dataset: {
        headers: [],
        data: [],
        paginationContext: {
          shouldPaginate: true,
          pageNumber: 2,
          pageSize: 10,
          totalCount: 10,
          isLastPage: true,
        },
      },
    });
    const store = setupMockStore(state);
    store.setCurrentPipelineName({ name: 'bar' });
    expect(store.currentPipelineName).toEqual('bar');
    // make sure the pagination is reset
    expect(store.dataset.paginationContext?.pageNumber).toEqual(1);
  });

  describe('setPipeline', function () {
    it('should do nothing if no pipeline is selected', function () {
      const state = buildState({});
      const store = setupMockStore(state);
      store.setPipeline({ pipeline: [] });
      expect(store.pipeline).toBeUndefined();
    });

    it('should replace the current pipeline', function () {
      const state = buildStateWithOnePipeline([], {
        dataset: {
          headers: [],
          data: [],
          paginationContext: {
            shouldPaginate: true,
            pageNumber: 2,
            pageSize: 10,
            totalCount: 10,
            isLastPage: true,
          },
        },
      });
      const store = setupMockStore(state);
      expect(store.pipeline).toEqual([]);

      const pipeline: Pipeline = [
        { name: 'domain', domain: 'foo' },
        { name: 'rename', toRename: [['foo', 'bar']] },
        { name: 'rename', toRename: [['baz', 'spam']] },
      ];
      store.setPipeline({ pipeline });
      expect(store.pipeline).toEqual(pipeline);
      // make sure the pagination is reset
      expect(store.dataset.paginationContext?.pageNumber).toEqual(1);
    });
  });

  it('sets pipelines', () => {
    const state = buildState({});
    const store = setupMockStore(state);
    store.setPipelines({ pipelines: { pipeline1: [], pipeline2: [] } });
    expect(store.pipelines).toEqual({ pipeline1: [], pipeline2: [] });
  });

  it('sets dataset', () => {
    const dataset = {
      headers: [{ name: 'col1' }, { name: 'col2' }],
      data: [[0, 0]],
      paginationContext: {
        shouldPaginate: false,
        totalCount: 50,
        pageSize: 50,
        pageNumber: 1,
        isLastPage: true,
      },
    };
    const state = buildState({});
    const store = setupMockStore(state);
    expect(store.dataset).toEqual({
      headers: [],
      data: [],
      paginationContext: emptyState().dataset.paginationContext,
    });
    store.setDataset({ dataset });
    expect(store.dataset).toEqual(dataset);
  });

  it('should create a step form', () => {
    const state = buildState({});
    const store = setupMockStore(state);
    store.createStepForm({ stepName: 'filter' });
    expect(store.isEditingStep).toBeTruthy();
    expect(store.currentStepFormName).toEqual('filter');
    expect(store.stepFormInitialValue).toBeUndefined();
  });

  it('should open a form for an existing step', () => {
    const state = buildState({});
    const store = setupMockStore(state);
    store.openStepForm({
      stepName: 'rename',
      initialValue: { oldname: 'oldcolumn', newname: 'newcolumn' },
    });
    expect(store.isEditingStep).toBeTruthy();
    expect(store.currentStepFormName).toEqual('rename');
    expect(store.stepFormInitialValue).toEqual({ oldname: 'oldcolumn', newname: 'newcolumn' });
  });

  it('should close an opened form', () => {
    const state = buildState({ currentStepFormName: 'rename' });
    const store = setupMockStore(state);
    store.closeStepForm(state);
    expect(store.isEditingStep).toBeFalsy();
    expect(store.currentStepFormName).toBeUndefined();
  });

  it('should reset step form initial value', () => {
    const state = buildState({
      stepFormInitialValue: { oldname: 'oldcolumn', newname: 'newcolumn' },
    });
    const store = setupMockStore(state);
    store.resetStepFormInitialValue(state);
    expect(store.stepFormInitialValue).toBeUndefined();
  });

  it('sets selected columns', () => {
    const state = buildState({});
    const store = setupMockStore(state);
    store.setSelectedColumns({ column: 'foo' });
    expect(store.selectedColumns).toEqual(['foo']);
  });

  it('does not set selected columns if payload is undefined', () => {
    const state = buildState({});
    const store = setupMockStore(state);
    store.setSelectedColumns({ column: undefined });
    expect(store.selectedColumns).toEqual([]);
  });

  it('logs backend errors', () => {
    const state = buildState({});
    const store = setupMockStore(state);
    store.logBackendMessages({
      backendMessages: [{ type: 'error', message: 'error msg' }],
    });
    expect(store.backendMessages).toEqual([{ type: 'error', message: 'error msg' }]);
    store.logBackendMessages({
      backendMessages: [{ type: 'error', message: 'error msg 2' }],
    });
    expect(store.backendMessages).toEqual([{ type: 'error', message: 'error msg 2' }]);
  });

  it('set loading to true', () => {
    const state = buildState({});
    const store = setupMockStore(state);
    const type = 'dataset';
    store.setLoading({
      type,
      isLoading: true,
    });
    expect(store.isLoading[type]).toEqual(true);
  });

  it('sets translator to true', () => {
    const state = buildState({ translator: 'mongo36' });
    const store = setupMockStore(state);
    store.setTranslator({
      translator: 'mongo40',
    });
    expect(store.translator).toEqual('mongo40');
  });
});

describe('action tests', () => {
  beforeEach(() => {
    // creates a fresh pinia and make it active so it's automatically picked
    // up by any useStore() call without having to pass it to it:
    // `useStore(pinia)`
    setActivePinia(createPinia());
  });
  it('selectPipeline', () => {
    const store = setupMockStore();
    const selectPipelineNameSpy = vi.spyOn(store, 'setCurrentPipelineName');
    const selectStepSpy = vi.spyOn(store, 'selectStep');
    const updateDatasetSpy = vi.spyOn(store, 'updateDataset');
    store.selectPipeline({ name: 'chapopointu' });
    // It should update the current selected pipeline
    expect(selectPipelineNameSpy).toHaveBeenCalledWith({ name: 'chapopointu' });
    // It should select the last step of that pipeline
    expect(selectStepSpy).toHaveBeenCalledWith({ index: -1 });
    // It should update the preview of the dataset
    expect(updateDatasetSpy).toHaveBeenLastCalledWith();
  });

  describe('updateDataset', () => {
    const dummyDataset: DataSet = {
      headers: [{ name: 'x' }, { name: 'y' }],
      data: [
        [1, 2],
        [3, 4],
      ],
    };
    const dummyDatasetWithUniqueComputed = {
      headers: [
        {
          name: 'x',
          uniques: {
            loaded: true,
            values: [
              { value: 1, count: 1 },
              { value: 3, count: 1 },
            ],
          },
        },
        {
          name: 'y',
          uniques: {
            loaded: true,
            values: [
              { value: 2, count: 1 },
              { value: 4, count: 1 },
            ],
          },
        },
      ],
      data: [
        [1, 2],
        [3, 4],
      ],
    };
    let instantiateDummyService: () => BackendService;
    beforeEach(() => {
      instantiateDummyService = (): BackendService => ({
        executePipeline: vi.fn().mockResolvedValue({ data: dummyDataset, translator: 'pandas' }),
      });
    });
    it('should reset the preview if the pipeline is empty', async () => {
      const store = setupMockStore({
        ...buildStateWithOnePipeline([] as Pipeline),
        backendService: instantiateDummyService(),
      });
      const setDatasetSpy = vi.spyOn(store, 'setDataset');
      await store.updateDataset();
      expect(setDatasetSpy).toHaveBeenCalledWith({
        dataset: {
          headers: [],
          data: [],
        },
      });
    });
    it('updateDataset without error', async () => {
      const pipeline: Pipeline = [
        { name: 'domain', domain: 'GoT' },
        { name: 'replace', searchColumn: 'characters', toReplace: [['Snow', 'Targaryen']] },
        { name: 'sort', columns: [{ column: 'death', order: 'asc' }] },
      ];
      const store = setupMockStore({
        ...buildStateWithOnePipeline(pipeline),
        backendService: instantiateDummyService(),
      });
      const logBackendMessagesSpy = vi.spyOn(store, 'logBackendMessages');
      const setLoadingSpy = vi.spyOn(store, 'setLoading');
      const toggleRequestOnGoingSpy = vi.spyOn(store, 'toggleRequestOnGoing');
      const setTranslatorSpy = vi.spyOn(store, 'setTranslator');
      const setDatasetSpy = vi.spyOn(store, 'setDataset');

      await store.updateDataset();
      // call 1 (clear backend messages) :
      expect(logBackendMessagesSpy).toHaveBeenCalledWith({ backendMessages: [] });
      // call 2 :
      expect(setLoadingSpy).toHaveBeenCalledWith({ type: 'dataset', isLoading: true });
      // call 3 :
      expect(toggleRequestOnGoingSpy).toHaveBeenCalledWith({ isRequestOnGoing: true });
      // call 4 (set the translator provided by backend meta) :
      expect(setTranslatorSpy).toHaveBeenCalledWith({ translator: 'pandas' });
      // call 5 :
      expect(logBackendMessagesSpy).toHaveBeenCalledWith({ backendMessages: [] });
      // call 6 :
      expect(setDatasetSpy).toHaveBeenCalledWith({ dataset: dummyDatasetWithUniqueComputed });
      // call 7 :
      expect(toggleRequestOnGoingSpy).toHaveBeenCalledWith({ isRequestOnGoing: false });
      // call 8 :
      expect(setLoadingSpy).toHaveBeenCalledWith({ type: 'dataset', isLoading: false });
    });

    it('updateDataset with error from service', async () => {
      const pipeline: Pipeline = [
        { name: 'domain', domain: 'GoT' },
        { name: 'replace', searchColumn: 'characters', toReplace: [['Snow', 'Targaryen']] },
        { name: 'sort', columns: [{ column: 'death', order: 'asc' }] },
      ];
      const store = setupMockStore({
        ...buildStateWithOnePipeline(pipeline),
        backendService: {
          executePipeline: vi.fn().mockResolvedValue({
            error: [{ type: 'error' as const, message: 'OMG an error happens' }],
          }),
        },
      });
      const logBackendMessagesSpy = vi.spyOn(store, 'logBackendMessages');
      const setLoadingSpy = vi.spyOn(store, 'setLoading');
      const toggleRequestOnGoingSpy = vi.spyOn(store, 'toggleRequestOnGoing');
      const setTranslatorSpy = vi.spyOn(store, 'setTranslator');

      await store.updateDataset();
      // call 1 (clear backend messages) :
      expect(logBackendMessagesSpy).toHaveBeenCalledWith({ backendMessages: [] });
      // call 2 :
      expect(setLoadingSpy).toHaveBeenCalledWith({ type: 'dataset', isLoading: true });
      // call 3 :
      expect(toggleRequestOnGoingSpy).toHaveBeenCalledWith({ isRequestOnGoing: true });
      // call 4 (set the translator provided by backend meta) :
      expect(setTranslatorSpy).toHaveBeenCalledWith({ translator: 'mongo50' });
      // call 5 :
      expect(logBackendMessagesSpy).toHaveBeenCalledWith({
        backendMessages: [{ message: 'OMG an error happens', type: 'error' }],
      });
      // call 6 :
      expect(toggleRequestOnGoingSpy).toHaveBeenCalledWith({ isRequestOnGoing: false });
      // call 7 :
      expect(setLoadingSpy).toHaveBeenCalledWith({ type: 'dataset', isLoading: false });
    });

    it('updateDataset with uncaught error from service', async () => {
      const pipeline: Pipeline = [
        { name: 'domain', domain: 'GoT' },
        { name: 'replace', searchColumn: 'characters', toReplace: [['Snow', 'Targaryen']] },
        { name: 'sort', columns: [{ column: 'death', order: 'asc' }] },
      ];
      const store = setupMockStore({
        ...buildStateWithOnePipeline(pipeline),
        backendService: {
          executePipeline: vi.fn().mockRejectedValue('Katastrophe!'),
        },
      });
      const logBackendMessagesSpy = vi.spyOn(store, 'logBackendMessages');
      const setLoadingSpy = vi.spyOn(store, 'setLoading');
      const toggleRequestOnGoingSpy = vi.spyOn(store, 'toggleRequestOnGoing');

      try {
        await store.updateDataset();
      } catch (e) {
        expect(e).toEqual('Katastrophe!');
      }

      // call 1 (clear backend messages) :
      expect(logBackendMessagesSpy).toHaveBeenCalledWith({ backendMessages: [] });
      // call 2 :
      expect(setLoadingSpy).toHaveBeenCalledWith({ type: 'dataset', isLoading: true });
      // call 3 :
      expect(toggleRequestOnGoingSpy).toHaveBeenCalledWith({ isRequestOnGoing: true });
      // call 4 :
      expect(logBackendMessagesSpy).toHaveBeenCalledWith({
        backendMessages: [{ message: 'Katastrophe!', type: 'error' }],
      });
      // call 5 :
      expect(toggleRequestOnGoingSpy).toHaveBeenCalledWith({ isRequestOnGoing: false });
      // call 6 :
      expect(setLoadingSpy).toHaveBeenCalledWith({ type: 'dataset', isLoading: false });
    });

    it('updateDataset with specific step error from service', async () => {
      const pipeline: Pipeline = [
        { name: 'domain', domain: 'GoT' },
        { name: 'replace', searchColumn: 'characters', toReplace: [['Snow', 'Targaryen']] },
        { name: 'sort', columns: [{ column: 'death', order: 'asc' }] },
      ];
      const store = setupMockStore({
        ...buildStateWithOnePipeline(pipeline),
        backendService: {
          executePipeline: vi.fn().mockResolvedValue({
            error: [{ type: 'error' as const, index: 1, message: 'Specific error for step' }],
          }),
        },
      });
      const logBackendMessagesSpy = vi.spyOn(store, 'logBackendMessages');
      const setLoadingSpy = vi.spyOn(store, 'setLoading');
      const toggleRequestOnGoingSpy = vi.spyOn(store, 'toggleRequestOnGoing');
      const setTranslatorSpy = vi.spyOn(store, 'setTranslator');

      await store.updateDataset();
      // call 1 (clear backend messages) :
      expect(logBackendMessagesSpy).toHaveBeenCalledWith({ backendMessages: [] });
      // call 2 :
      expect(setLoadingSpy).toHaveBeenCalledWith({ type: 'dataset', isLoading: true });
      // call 3 :
      expect(toggleRequestOnGoingSpy).toHaveBeenCalledWith({ isRequestOnGoing: true });
      // call 4 (set the translator provided by backend meta) :
      expect(setTranslatorSpy).toHaveBeenCalledWith({ translator: 'mongo50' });
      // call 5 :
      expect(logBackendMessagesSpy).toHaveBeenCalledWith({
        backendMessages: [{ type: 'error', index: 1, message: 'Specific error for step' }],
      });
      // call 6 :
      expect(toggleRequestOnGoingSpy).toHaveBeenCalledWith({ isRequestOnGoing: false });
      // call 7 :
      expect(setLoadingSpy).toHaveBeenCalledWith({ type: 'dataset', isLoading: false });
    });
  });

  describe('loadColumnUniqueValues', () => {
    const dummyDataset: DataSet = {
      headers: [
        { name: 'city', uniques: { values: [{ value: 'Lyon', count: 50 }], loaded: false } },
      ],
      data: [['Lyon']],
    };
    const resultOfAggregationCountOnCity: DataSet = {
      headers: [{ name: 'city' }, { name: '__vqb_count__' }],
      data: [
        ['Lyon', 150],
        ['Marseille', 100],
        ['Paris', 200],
      ],
    };
    let instantiateDummyService: () => BackendService;
    beforeEach(() => {
      instantiateDummyService = () => ({
        executePipeline: vi.fn().mockResolvedValue({ data: resultOfAggregationCountOnCity }),
      });
    });

    it('should not call anything if pipeline is empty', async () => {
      const dummyService = instantiateDummyService();
      const store = setupMockStore({
        ...buildStateWithOnePipeline([], { dataset: dummyDataset }),
        backendService: dummyService,
      });
      const setLoadingSpy = vi.spyOn(store, 'setLoading');
      await store.loadColumnUniqueValues({ column: 'city' });
      expect(setLoadingSpy).toHaveBeenCalledTimes(2);
      // call 1:
      expect(setLoadingSpy.mock.calls[0][0]).toEqual({ type: 'uniqueValues', isLoading: true });
      // call 2:
      expect(setLoadingSpy.mock.calls[1][0]).toEqual({ type: 'uniqueValues', isLoading: false });
      // backend Service is not called:
      expect(dummyService.executePipeline).toHaveBeenCalledTimes(0);
    });

    it('should commit a new dataset with headers updated', async () => {
      const pipeline: Pipeline = [{ name: 'domain', domain: 'foo' }];
      const dummyService = instantiateDummyService();
      const store = setupMockStore({
        ...buildStateWithOnePipeline(pipeline, { dataset: dummyDataset }),
        backendService: dummyService,
      });
      const expectedPipeline: Pipeline = [
        ...pipeline,
        {
          name: 'aggregate',
          aggregations: [
            {
              columns: ['city'],
              aggfunction: 'count' as const,
              newcolumns: ['__vqb_count__'],
            },
          ],
          on: ['city'],
        },
      ];
      const setLoadingSpy = vi.spyOn(store, 'setLoading');
      const setDatasetSpy = vi.spyOn(store, 'setDataset');
      await store.loadColumnUniqueValues({ column: 'city' });
      expect(dummyService.executePipeline).toHaveBeenCalledWith(
        expectedPipeline,
        expect.objectContaining({ default_pipeline: pipeline }),
      );
      // call 1:
      expect(setLoadingSpy.mock.calls[0][0]).toEqual({ type: 'uniqueValues', isLoading: true });
      // call 2:
      expect(setDatasetSpy.mock.calls[0][0]).toEqual({
        dataset: {
          headers: [
            {
              name: 'city',
              uniques: {
                values: [
                  { value: 'Lyon', count: 150 },
                  { value: 'Marseille', count: 100 },
                  { value: 'Paris', count: 200 },
                ],
                loaded: true,
              },
            },
          ],
          data: [['Lyon']],
        },
      });
      // call 3:
      expect(setLoadingSpy.mock.calls[1][0]).toEqual({ type: 'uniqueValues', isLoading: false });
    });
  });

  describe('setAvailableVariables', function () {
    it('set available variables', () => {
      const state = buildState({});
      const availableVariables = [
        { identifier: 'var1', value: 1, label: 'First variable' },
        { identifier: 'var2', value: 2, label: 'Second variable' },
      ];
      const store = setupMockStore(state);
      store.setAvailableVariables({ availableVariables });
      expect(store.availableVariables).toEqual(availableVariables);
    });
  });

  describe('setVariableDelimiters', function () {
    it('set variable delimiters', () => {
      const state = buildState({});
      const variableDelimiters = { start: '{{', end: '}}' };
      const store = setupMockStore(state);
      store.setVariableDelimiters({ variableDelimiters });
      expect(store.variableDelimiters).toEqual(variableDelimiters);
    });
  });

  describe('setBackendService', function () {
    it('set the backend service', () => {
      const state = buildState({});
      const store = setupMockStore(state);
      const backendService = {
        executePipeline: vi.fn(),
      } as BackendService;
      store.setBackendService({ backendService });
      expect(store.backendService).toEqual(backendService);
    });
  });

  describe('formatError', () => {
    it('should format a string error to a correct BackendError object', () => {
      const error = 'global error message';
      expect(formatError(error)).toStrictEqual({ type: 'error', message: 'global error message' });
    });
    it('should format an object error to a correct BackendError object', () => {
      const error = { index: 1, message: 'Step specific error' };
      expect(formatError(error)).toStrictEqual({
        type: 'error',
        index: 1,
        message: 'Step specific error',
      });
    });
  });

  describe('getColumnNamesFromPipeline', () => {
    let store: Store<'vqb', any>, mockBackendServiceExecutePipeline: Mock;

    beforeEach(() => {
      mockBackendServiceExecutePipeline = vi.fn();

      store = setupMockStore(
        buildState({
          backendService: {
            executePipeline: mockBackendServiceExecutePipeline,
          },
          currentPipelineName: 'coco_l_asticot',
          pipelines: {
            coco_l_asticot: [
              { name: 'domain', domain: 'plop' },
              { name: 'text', newColumn: 'yolo', text: 'asticot' },
            ],
            dataset1: [],
            dataset2: [],
          },
        }),
      );
    });

    it('should not return anything if no pipeline name or domain is provided', async () => {
      expect(await store.getColumnNamesFromPipeline('')).toBeUndefined();
      expect(mockBackendServiceExecutePipeline).not.toHaveBeenCalled();
    });

    it('should return the column names from an existing pipeline', async () => {
      mockBackendServiceExecutePipeline.mockResolvedValue({
        data: { headers: [{ name: 'A' }, { name: 'B' }, { name: 'C' }] },
      });
      expect(await store.getColumnNamesFromPipeline('coco_l_asticot')).toEqual(['A', 'B', 'C']);
      expect(mockBackendServiceExecutePipeline).toHaveBeenLastCalledWith(
        [
          { name: 'domain', domain: 'plop' },
          { name: 'text', newColumn: 'yolo', text: 'asticot' },
        ],
        {
          coco_l_asticot: [
            { name: 'domain', domain: 'plop' },
            { name: 'text', newColumn: 'yolo', text: 'asticot' },
          ],
          dataset1: [],
          dataset2: [],
        },
        1,
        0,
      );
    });

    it('should return the column names from a domain', async () => {
      mockBackendServiceExecutePipeline.mockResolvedValue({
        data: { headers: [{ name: 'meow' }, { name: 'ouaf' }] },
      });
      expect(await store.getColumnNamesFromPipeline('other')).toEqual(['meow', 'ouaf']);
      expect(mockBackendServiceExecutePipeline).toHaveBeenLastCalledWith(
        [
          {
            name: 'domain',
            domain: 'other',
          },
        ],
        {
          coco_l_asticot: [
            { name: 'domain', domain: 'plop' },
            { name: 'text', newColumn: 'yolo', text: 'asticot' },
          ],
          dataset1: [],
          dataset2: [],
        },
        1,
        0,
      );
    });
  });
});
