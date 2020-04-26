import { Store } from 'vuex';

import { Pipeline } from '@/lib/steps';
import { VQBnamespace } from '@/store';
import { BackendService, servicePluginFactory } from '@/store/backend-plugin';
import getters from '@/store/getters';
import mutations from '@/store/mutations';
import { currentPipeline, emptyState } from '@/store/state';

import { buildState, buildStateWithOnePipeline, setupMockStore } from './utils';

describe('getter tests', () => {
  describe('(in)active pipeline steps', () => {
    it('should not return anything without any selected pipeline', () => {
      const state = buildState({});
      expect(getters.activePipeline(state, {}, {}, {})).toBeUndefined();
      expect(getters.inactivePipeline(state, {}, {}, {})).toBeUndefined();
    });

    it('should return the whole pipeline if selectedIndex is -1', () => {
      const pipeline: Pipeline = [
        { name: 'domain', domain: 'foo' },
        { name: 'rename', oldname: 'foo', newname: 'bar' },
        { name: 'rename', oldname: 'baz', newname: 'spam' },
      ];
      const state = buildStateWithOnePipeline(pipeline);
      expect(getters.activePipeline(state, {}, {}, {})).toEqual(pipeline);
    });

    it('should return a partial pipeline if selectedIndex is specified', () => {
      const pipeline: Pipeline = [
        { name: 'domain', domain: 'foo' },
        { name: 'rename', oldname: 'foo', newname: 'bar' },
        { name: 'rename', oldname: 'baz', newname: 'spam' },
      ];
      const state = buildStateWithOnePipeline(pipeline, { selectedStepIndex: 1 });
      expect(getters.activePipeline(state, {}, {}, {})).toEqual(pipeline.slice(0, 2));
    });

    it('should return an empty pipeline if selectedIndex is -1', () => {
      const pipeline: Pipeline = [
        { name: 'domain', domain: 'foo' },
        { name: 'rename', oldname: 'foo', newname: 'bar' },
        { name: 'rename', oldname: 'baz', newname: 'spam' },
      ];
      const state = buildStateWithOnePipeline(pipeline);
      expect(getters.inactivePipeline(state, {}, {}, {})).toEqual([]);
    });

    it('should return the rest of the pipeline if selectedIndex is specified', () => {
      const pipeline: Pipeline = [
        { name: 'domain', domain: 'foo' },
        { name: 'rename', oldname: 'foo', newname: 'bar' },
        { name: 'rename', oldname: 'baz', newname: 'spam' },
      ];
      const state = buildStateWithOnePipeline(pipeline, { selectedStepIndex: 1 });
      expect(getters.inactivePipeline(state, {}, {}, {})).toEqual(pipeline.slice(2));
    });
  });

  describe('active step index tests', () => {
    it('should not return anything if no pipeline is selected', () => {
      const state = buildState({});
      expect(getters.computedActiveStepIndex(state, {}, {}, {})).toBeUndefined();
    });

    it('should compute active step index if selectedIndex is -1', () => {
      const pipeline: Pipeline = [
        { name: 'domain', domain: 'foo' },
        { name: 'rename', oldname: 'foo', newname: 'bar' },
        { name: 'rename', oldname: 'baz', newname: 'spam' },
      ];
      const state = buildStateWithOnePipeline(pipeline);
      expect(getters.computedActiveStepIndex(state, {}, {}, {})).toEqual(2);
    });

    it('should compute active step index if selectedIndex is specified', () => {
      const pipeline: Pipeline = [
        { name: 'domain', domain: 'foo' },
        { name: 'rename', oldname: 'foo', newname: 'bar' },
        { name: 'rename', oldname: 'baz', newname: 'spam' },
      ];
      const state = buildStateWithOnePipeline(pipeline, { selectedStepIndex: 1 });
      expect(getters.computedActiveStepIndex(state, {}, {}, {})).toEqual(1);
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
      expect(getters.columnNames(state, {}, {}, {})).toEqual(['col1', 'col2']);
    });

    it('should be able to handle empty headers', () => {
      const state = buildState({
        dataset: {
          headers: [],
          data: [],
        },
      });
      expect(getters.columnNames(state, {}, {}, {})).toEqual([]);
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
      const columnTypes = getters.columnTypes(state, {}, {}, {});
      expect(columnTypes).toEqual({
        col1: 'integer',
        col2: 'boolean',
        col3: undefined,
      });
    });
  });

  describe('column isUniqueValuesLoading tests', () => {
    it('should return a boolean indicating if column unique values are loading types', () => {
      const state = buildState({
        dataset: {
          headers: [
            { name: 'col1', isUniqueValuesLoading: true },
            { name: 'col2', isUniqueValuesLoading: false },
            { name: 'col3' },
          ],
          data: [],
        },
      });
      expect(getters.isUniqueValuesLoading(state, {}, {}, {})('col1')).toEqual(true);
      expect(getters.isUniqueValuesLoading(state, {}, {}, {})('col2')).toEqual(false);
      expect(getters.isUniqueValuesLoading(state, {}, {}, {})('col3')).toBeUndefined();
    });
  });

  describe('domain extraction tests', () => {
    it('should not return anything if no pipeline is selected', function() {
      const state = buildState({});
      expect(getters.domainStep(state, {}, {}, {})).toBeUndefined;
    });

    it('should return the domain step', () => {
      const pipeline: Pipeline = [
        { name: 'domain', domain: 'foo' },
        { name: 'rename', oldname: 'foo', newname: 'bar' },
        { name: 'rename', oldname: 'baz', newname: 'spam' },
      ];
      const state = buildStateWithOnePipeline(pipeline);
      expect(getters.domainStep(state, {}, {}, {})).toEqual(pipeline[0]);
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
      expect(getters.isDatasetEmpty(state, {}, {}, {})).toBeTruthy();
    });

    it('should return false if dataset is not empty', () => {
      const state = buildState({
        dataset: {
          headers: [{ name: 'col1' }, { name: 'col2' }],
          data: [[0, 0]],
        },
      });
      expect(getters.isDatasetEmpty(state, {}, {}, {})).toBeFalsy();
    });
  });

  describe('pipeline empty tests', () => {
    it('should not return anything if no pipeline is selected', function() {
      const state = buildState({});
      expect(getters.isPipelineEmpty(state, {}, {}, {})).toBeUndefined;
    });

    it('should return true if pipeline is empty', () => {
      const pipeline: Pipeline = [];
      const state = buildStateWithOnePipeline(pipeline);
      expect(getters.isPipelineEmpty(state, {}, {}, {})).toBeTruthy();
    });

    it('should return false if pipeline is not empty', () => {
      const pipeline: Pipeline = [
        { name: 'domain', domain: 'foo' },
        { name: 'rename', oldname: 'foo', newname: 'bar' },
        { name: 'rename', oldname: 'baz', newname: 'spam' },
      ];
      const state = buildStateWithOnePipeline(pipeline);
      expect(getters.isPipelineEmpty(state, {}, {}, {})).toBeFalsy();
    });
  });

  describe('step disabled tests', () => {
    it('should return false if selected step is not specified or -1', () => {
      let state = buildState({});
      expect(getters.isStepDisabled(state, {}, {}, {})(0)).toBeFalsy();
      expect(getters.isStepDisabled(state, {}, {}, {})(1)).toBeFalsy();
      state = buildState({ selectedStepIndex: -1 });
      expect(getters.isStepDisabled(state, {}, {}, {})(0)).toBeFalsy();
      expect(getters.isStepDisabled(state, {}, {}, {})(1)).toBeFalsy();
    });

    it('should return false if selected step index is greater than index', () => {
      const state = buildState({ selectedStepIndex: 1 });
      expect(getters.isStepDisabled(state, {}, {}, {})(0)).toBeFalsy();
      expect(getters.isStepDisabled(state, {}, {}, {})(1)).toBeFalsy();
    });

    it('should return true if selected step index is lower than index', () => {
      const state = buildState({ selectedStepIndex: 1 });
      expect(getters.isStepDisabled(state, {}, {}, {})(2)).toBeTruthy();
      expect(getters.isStepDisabled(state, {}, {}, {})(3)).toBeTruthy();
    });
  });

  describe('step configuration', () => {
    it('should retrieve the configuration of a step using its index', function() {
      const pipeline: Pipeline = [
        { name: 'domain', domain: 'foo' },
        { name: 'rename', oldname: 'foo', newname: 'bar' },
        { name: 'rename', oldname: 'baz', newname: 'spam' },
      ];
      const state = buildStateWithOnePipeline(pipeline);
      expect(getters.stepConfig(state, {}, {}, {})(1)).toEqual(pipeline[1]);
    });

    it('should not return anything if there is no selected pipeline', function() {
      const state = buildState({});
      expect(getters.stepConfig(state, {}, {}, {})(0)).toBeUndefined();
    });
  });

  describe('message error related test', () => {
    it('should return false if backendError is undefined', () => {
      const state = buildState({ backendErrors: [] });
      expect(getters.thereIsABackendError(state, {}, {}, {})).toBeFalsy();
    });

    it('should return true if backendError is not undefined', () => {
      const state = buildState({ backendErrors: [{ type: 'error', message: 'error msg' }] });
      expect(getters.thereIsABackendError(state, {}, {}, {})).toBeTruthy();
    });
  });

  describe('translator', () => {
    it('should return the app translator', () => {
      const state = buildState({ translator: 'mongo40' });
      expect(getters.translator(state, {}, {}, {})).toEqual('mongo40');
    });
  });
});

describe('mutation tests', () => {
  it('selects step', () => {
    const pipeline: Pipeline = [
      { name: 'domain', domain: 'foo' },
      { name: 'rename', oldname: 'foo', newname: 'bar' },
      { name: 'rename', oldname: 'baz', newname: 'spam' },
    ];
    const state = buildStateWithOnePipeline(pipeline, {
      dataset: { headers: [], data: [], paginationContext: { pageno: 2, pagesize: 10 } },
    });
    expect(state.selectedStepIndex).toEqual(-1);
    mutations.selectStep(state, { index: 2 });
    expect(state.selectedStepIndex).toEqual(2);
    // make sure the pagination is reset
    expect(state.dataset.paginationContext?.pageno).toEqual(1);

    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    mutations.selectStep(state, { index: 5 });
    expect(spy).toHaveBeenCalled();
    expect(state.selectedStepIndex).toEqual(-1);
    spy.mockRestore();
  });

  describe('deleteStep', function() {
    it('should do nothing if no pipeline is selected', () => {
      const state = buildState({});
      mutations.deleteStep(state, { index: 1 });
      expect(currentPipeline(state)).toBeUndefined();
    });

    it('should delete a step on an existing pipeline and select the previous one', () => {
      const pipeline: Pipeline = [
        { name: 'domain', domain: 'foo' },
        { name: 'rename', oldname: 'foo', newname: 'bar' },
        { name: 'rename', oldname: 'baz', newname: 'spam' },
        { name: 'rename', oldname: 'clou', newname: 'vis' },
      ];
      const state = buildStateWithOnePipeline(pipeline, {
        dataset: { headers: [], data: [], paginationContext: { pageno: 2, pagesize: 10 } },
      });
      mutations.deleteStep(state, { index: 2 });
      expect(currentPipeline(state)).toEqual([
        { name: 'domain', domain: 'foo' },
        { name: 'rename', oldname: 'foo', newname: 'bar' },
        { name: 'rename', oldname: 'clou', newname: 'vis' },
      ]);
      expect(state.selectedStepIndex).toEqual(1);
      // make sure the pagination is reset
      expect(state.dataset.paginationContext?.pageno).toEqual(1);
    });
  });

  it('sets current domain on empty pipeline', () => {
    const state = buildStateWithOnePipeline([], { currentDomain: 'foo' });
    expect(state.currentDomain).toEqual('foo');
    mutations.setCurrentDomain(state, { currentDomain: 'bar' });
    expect(state.currentDomain).toEqual('bar');
    expect(getters.pipeline(state, {}, {}, {})).toEqual([{ name: 'domain', domain: 'bar' }]);
  });

  it('sets current domain on non empty pipeline', () => {
    const pipeline: Pipeline = [
      { name: 'domain', domain: 'foo' },
      { name: 'rename', oldname: 'foo', newname: 'bar' },
      { name: 'rename', oldname: 'baz', newname: 'spam' },
    ];
    const state = buildState({
      currentDomain: 'foo',
      ...buildStateWithOnePipeline(pipeline, {
        dataset: { headers: [], data: [], paginationContext: { pageno: 2, pagesize: 10 } },
      }),
    });
    expect(state.currentDomain).toEqual('foo');
    mutations.setCurrentDomain(state, { currentDomain: 'bar' });
    expect(state.currentDomain).toEqual('bar');
    expect(getters.pipeline(state, {}, {}, {})).toEqual([
      { name: 'domain', domain: 'bar' },
      { name: 'rename', oldname: 'foo', newname: 'bar' },
      { name: 'rename', oldname: 'baz', newname: 'spam' },
    ]);
    // make sure the pagination is reset
    expect(state.dataset.paginationContext?.pageno).toEqual(1);
  });

  it('do nothing without any current pipeline', () => {
    const state = buildState({});
    mutations.setCurrentDomain(state, { currentDomain: 'bar' });
    expect(state.currentDomain).toBeUndefined();
  });

  it('sets domain list', () => {
    const state = buildState({});
    expect(state.domains).toEqual([]);
    mutations.setDomains(state, { domains: ['foo', 'bar'] });
    expect(state.domains).toEqual(['foo', 'bar']);
    expect(state.currentDomain).toEqual('foo');
  });

  it('updates current domain when inconsistent with setDomains', () => {
    const state = buildState({ currentDomain: 'babar' });
    expect(state.domains).toEqual([]);
    mutations.setDomains(state, { domains: ['foo', 'bar'] });
    expect(state.domains).toEqual(['foo', 'bar']);
    expect(state.currentDomain).toEqual('foo');
  });

  it('leaves current domain untouched when consistent with setDomains', () => {
    const state = buildState({ currentDomain: 'bar' });
    expect(state.domains).toEqual([]);
    mutations.setDomains(state, { domains: ['foo', 'bar'] });
    expect(state.domains).toEqual(['foo', 'bar']);
    expect(state.currentDomain).toEqual('bar');
  });

  it('sets currentPipelineName', () => {
    const state = buildState({
      dataset: { headers: [], data: [], paginationContext: { pageno: 2, pagesize: 10 } },
    });
    mutations.setCurrentPipelineName(state, { name: 'bar' });
    expect(state.currentPipelineName).toEqual('bar');
    // make sure the pagination is reset
    expect(state.dataset.paginationContext?.pageno).toEqual(1);
  });

  describe('setPipeline', function() {
    it('should do nothing if no pipeline is selected', function() {
      const state = buildState({});
      mutations.setPipeline(state, { pipeline: [] });
      expect(getters.pipeline(state, {}, {}, {})).toBeUndefined();
    });

    it('should replace the current pipeline', function() {
      const state = buildStateWithOnePipeline([], {
        dataset: { headers: [], data: [], paginationContext: { pageno: 2, pagesize: 10 } },
      });
      expect(getters.pipeline(state, {}, {}, {})).toEqual([]);

      const pipeline: Pipeline = [
        { name: 'domain', domain: 'foo' },
        { name: 'rename', oldname: 'foo', newname: 'bar' },
        { name: 'rename', oldname: 'baz', newname: 'spam' },
      ];
      mutations.setPipeline(state, { pipeline });
      expect(getters.pipeline(state, {}, {}, {})).toEqual(pipeline);
      // make sure the pagination is reset
      expect(state.dataset.paginationContext?.pageno).toEqual(1);
    });
  });

  it('should set current domain when updating pipeline with domain', () => {
    const pipeline: Pipeline = [
      { name: 'domain', domain: 'foo' },
      { name: 'rename', oldname: 'foo', newname: 'bar' },
    ];
    const state = buildState(
      buildStateWithOnePipeline([{ name: 'domain', domain: 'babar' }], {
        currentDomain: 'babar',
      }),
    );
    expect(getters.pipeline(state, {}, {}, {})).toEqual([{ name: 'domain', domain: 'babar' }]);
    expect(state.currentDomain).toEqual('babar');
    mutations.setPipeline(state, { pipeline });
    expect(getters.pipeline(state, {}, {}, {})).toEqual(pipeline);
    expect(state.currentDomain).toEqual('foo');
  });

  it('should not set current domain when updating pipeline without domain', () => {
    const pipeline: Pipeline = [
      { name: 'domain', domain: 'foo' },
      { name: 'rename', oldname: 'foo', newname: 'bar' },
    ];
    const state = buildState(
      buildStateWithOnePipeline([{ name: 'rename', oldname: 'foo', newname: 'bar' }], {
        currentDomain: 'foo',
      }),
    );
    mutations.setPipeline(state, { pipeline });
    expect(getters.pipeline(state, {}, {}, {})).toEqual(pipeline);
    expect(state.currentDomain).toEqual('foo');
  });

  it('sets pipelines', () => {
    const state = buildState({});
    mutations.setPipelines(state, { pipelines: { pipeline1: [], pipeline2: [] } });
    expect(state.pipelines).toEqual({ pipeline1: [], pipeline2: [] });
  });

  it('sets dataset', () => {
    const dataset = {
      headers: [{ name: 'col1' }, { name: 'col2' }],
      data: [[0, 0]],
      paginationContext: {
        totalCount: 0,
        pagesize: 50,
        pageno: 1,
      },
    };
    const state = buildState({});
    expect(state.dataset).toEqual({
      headers: [],
      data: [],
      paginationContext: emptyState().dataset.paginationContext,
    });
    mutations.setDataset(state, { dataset });
    expect(state.dataset).toEqual(dataset);
  });

  it('should create a step form', () => {
    const state = buildState({});
    mutations.createStepForm(state, { stepName: 'filter' });
    expect(getters.isEditingStep(state, {}, {}, {})).toBeTruthy();
    expect(state.currentStepFormName).toEqual('filter');
    expect(state.stepFormInitialValue).toBeUndefined();
  });

  it('should open a form for an existing step', () => {
    const state = buildState({});
    mutations.openStepForm(state, {
      stepName: 'rename',
      initialValue: { oldname: 'oldcolumn', newname: 'newcolumn' },
    });
    expect(getters.isEditingStep(state, {}, {}, {})).toBeTruthy();
    expect(state.currentStepFormName).toEqual('rename');
    expect(state.stepFormInitialValue).toEqual({ oldname: 'oldcolumn', newname: 'newcolumn' });
  });

  it('should close an opened form', () => {
    const state = buildState({ currentStepFormName: 'rename' });
    mutations.closeStepForm(state);
    expect(getters.isEditingStep(state, {}, {}, {})).toBeFalsy();
    expect(state.currentStepFormName).toBeUndefined();
  });

  it('should reset step form initial value', () => {
    const state = buildState({
      stepFormInitialValue: { oldname: 'oldcolumn', newname: 'newcolumn' },
    });
    mutations.resetStepFormInitialValue(state);
    expect(state.stepFormInitialValue).toBeUndefined();
  });

  it('sets selected columns', () => {
    const state = buildState({});
    mutations.setSelectedColumns(state, { column: 'foo' });
    expect(state.selectedColumns).toEqual(['foo']);
  });

  it('does not set selected columns if payload is undefined', () => {
    const state = buildState({});
    mutations.setSelectedColumns(state, { column: undefined });
    expect(state.selectedColumns).toEqual([]);
  });

  it('logs backend errors', () => {
    const state = buildState({});
    mutations.logBackendError(state, {
      backendError: { type: 'error', message: 'error msg' },
    });
    expect(state.backendErrors).toEqual([{ type: 'error', message: 'error msg' }]);
    mutations.logBackendError(state, {
      backendError: { type: 'error', message: 'error msg 2' },
    });
    expect(state.backendErrors).toEqual([
      { type: 'error', message: 'error msg' },
      { type: 'error', message: 'error msg 2' },
    ]);
  });

  it('resets backend errors', () => {
    const state = buildState({});
    mutations.logBackendError(state, {
      backendError: { type: 'error', message: 'error msg' },
    });
    mutations.resetBackendErrors(state);
    expect(state.backendErrors).toEqual([]);
  });

  it('set loading to true', () => {
    const state = buildState({});
    mutations.setLoading(state, {
      isLoading: true,
    });
    expect(state.isLoading).toEqual(true);
  });

  it('sets translator to true', () => {
    const state = buildState({ translator: 'mongo36' });
    mutations.setTranslator(state, {
      translator: 'mongo40',
    });
    expect(state.translator).toEqual('mongo40');
  });

  it('set isUniqueValuesLoading to true', () => {
    const state = buildState({
      dataset: {
        headers: [{ name: 'col1', isUniqueValuesLoading: false }, { name: 'col2' }],
        data: [],
      },
    });
    mutations.setUniqueValuesLoading(state, {
      isLoading: true,
      column: 'col1',
    });
    expect(state.dataset.headers[0].isUniqueValuesLoading).toEqual(true);

    mutations.setUniqueValuesLoading(state, {
      isLoading: true,
      column: 'col2',
    });
    expect(state.dataset.headers[1].isUniqueValuesLoading).toEqual(true);
  });
});

describe('action tests', () => {
  it('selectPipeline', () => {
    const store = setupMockStore();
    const commitSpy = jest.spyOn(store, 'commit');
    store.dispatch(VQBnamespace('selectPipeline'), { name: 'chapopointu' });
    expect(commitSpy).toHaveBeenCalledTimes(2);
    // call 1 :
    expect(commitSpy.mock.calls[0][0]).toEqual(VQBnamespace('setCurrentPipelineName'));
    expect(commitSpy.mock.calls[0][1]).toEqual({ name: 'chapopointu' });
    // call 2 :
    expect(commitSpy.mock.calls[1][0]).toEqual(VQBnamespace('selectStep'));
    expect(commitSpy.mock.calls[1][1]).toEqual({ index: -1 });
  });

  it('updateDataset without error', async () => {
    const dummyDataset = {
      headers: [{ name: 'x' }, { name: 'y' }],
      data: [
        [1, 2],
        [3, 4],
      ],
    };
    class DummyService implements BackendService {
      listCollections(_store: Store<any>) {
        return Promise.resolve({ data: ['foo', 'bar'] });
      }

      // eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
      executePipeline(_store: Store<any>, _pipeline: Pipeline, _limit: number, _offset: number) {
        return Promise.resolve({ data: dummyDataset });
      }
    }
    const pipeline: Pipeline = [
      { name: 'domain', domain: 'GoT' },
      { name: 'replace', search_column: 'characters', to_replace: [['Snow', 'Targaryen']] },
      { name: 'sort', columns: [{ column: 'death', order: 'asc' }] },
    ];
    const store = setupMockStore(buildStateWithOnePipeline(pipeline), [
      servicePluginFactory(new DummyService()),
    ]);
    const commitSpy = jest.spyOn(store, 'commit');

    await store.dispatch(VQBnamespace('updateDataset'));
    expect(commitSpy).toHaveBeenCalledTimes(5);
    // call 1 :
    expect(commitSpy.mock.calls[0][0]).toEqual(VQBnamespace('setLoading'));
    expect(commitSpy.mock.calls[0][1]).toEqual({ isLoading: true });
    // call 2 :
    expect(commitSpy.mock.calls[1][0]).toEqual(VQBnamespace('toggleRequestOnGoing'));
    expect(commitSpy.mock.calls[1][1]).toEqual({ isRequestOnGoing: true });
    // call 3 :
    expect(commitSpy.mock.calls[2][0]).toEqual(VQBnamespace('toggleRequestOnGoing'));
    expect(commitSpy.mock.calls[2][1]).toEqual({ isRequestOnGoing: false });
    // call 3 :
    expect(commitSpy.mock.calls[3][0]).toEqual(VQBnamespace('setDataset'));
    expect(commitSpy.mock.calls[3][1]).toEqual({ dataset: dummyDataset });
    // call 5 :
    expect(commitSpy.mock.calls[4][0]).toEqual(VQBnamespace('setLoading'));
    expect(commitSpy.mock.calls[4][1]).toEqual({ isLoading: false });
  });

  it('updateDataset with error from service', async () => {
    class DummyService implements BackendService {
      listCollections(_store: Store<any>) {
        return Promise.resolve({ data: ['foo', 'bar'] });
      }

      // eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
      executePipeline(_store: Store<any>, _pipeline: Pipeline, _limit: number, _offset: number) {
        return Promise.resolve({
          error: { type: 'error' as 'error', message: 'OMG an error happens' },
        });
      }
    }
    const pipeline: Pipeline = [
      { name: 'domain', domain: 'GoT' },
      { name: 'replace', search_column: 'characters', to_replace: [['Snow', 'Targaryen']] },
      { name: 'sort', columns: [{ column: 'death', order: 'asc' }] },
    ];
    const store = setupMockStore(buildStateWithOnePipeline(pipeline), [
      servicePluginFactory(new DummyService()),
    ]);
    const commitSpy = jest.spyOn(store, 'commit');

    await store.dispatch(VQBnamespace('updateDataset'));
    expect(commitSpy).toHaveBeenCalledTimes(5);
    // call 1 :
    expect(commitSpy.mock.calls[0][0]).toEqual(VQBnamespace('setLoading'));
    expect(commitSpy.mock.calls[0][1]).toEqual({ isLoading: true });
    // call 2 :
    expect(commitSpy.mock.calls[1][0]).toEqual(VQBnamespace('toggleRequestOnGoing'));
    expect(commitSpy.mock.calls[1][1]).toEqual({ isRequestOnGoing: true });
    // call 3 :
    expect(commitSpy.mock.calls[2][0]).toEqual(VQBnamespace('logBackendError'));
    expect(commitSpy.mock.calls[2][1]).toEqual({
      backendError: { message: 'OMG an error happens', type: 'error' },
    });
    // call 4 :
    expect(commitSpy.mock.calls[3][0]).toEqual(VQBnamespace('toggleRequestOnGoing'));
    expect(commitSpy.mock.calls[3][1]).toEqual({ isRequestOnGoing: false });
    // call 5 :
    expect(commitSpy.mock.calls[4][0]).toEqual(VQBnamespace('setLoading'));
    expect(commitSpy.mock.calls[4][1]).toEqual({ isLoading: false });
  });
});
