import { Store } from 'vuex';

import { BackendService } from '@/lib/backend';
import { DataSet } from '@/lib/dataset';
import { Pipeline } from '@/lib/steps';
import { VQBnamespace } from '@/store';
import { formatError } from '@/store/actions';
import getters from '@/store/getters';
import mutations from '@/store/mutations';
import { currentPipeline, emptyState } from '@/store/state';

import { buildState, buildStateWithOnePipeline, RootState, setupMockStore } from './utils';

describe('getter tests', () => {
  describe('pipelines', () => {
    it('should return the pipelines', () => {
      const pipelines = { foo: [], bar: [] };
      const state = buildState({
        pipelines,
      });
      expect(getters.pipelines(state, {}, {}, {})).toEqual(pipelines);
    });
  });

  describe('(in)active pipeline steps', () => {
    it('should not return anything without any selected pipeline', () => {
      const state = buildState({});
      expect(getters.activePipeline(state, {}, {}, {})).toBeUndefined();
      expect(getters.inactivePipeline(state, {}, {}, {})).toBeUndefined();
    });

    it('should return the whole pipeline if selectedIndex is -1', () => {
      const pipeline: Pipeline = [
        { name: 'domain', domain: 'foo' },
        { name: 'rename', toRename: [['foo', 'bar']] },
        { name: 'rename', toRename: [['baz', 'spam']] },
      ];
      const state = buildStateWithOnePipeline(pipeline);
      expect(getters.activePipeline(state, {}, {}, {})).toEqual(pipeline);
    });

    it('should return backendMessages', () => {
      const state = buildState({ backendMessages: [{ type: 'error', message: 'lalalolilol' }] });
      expect(getters.backendMessages(state, {}, {}, {})).toEqual([
        { type: 'error', message: 'lalalolilol' },
      ]);
    });

    it('should return a partial pipeline if selectedIndex is specified', () => {
      const pipeline: Pipeline = [
        { name: 'domain', domain: 'foo' },
        { name: 'rename', toRename: [['foo', 'bar']] },
        { name: 'rename', toRename: [['baz', 'spam']] },
      ];
      const state = buildStateWithOnePipeline(pipeline, { selectedStepIndex: 1 });
      expect(getters.activePipeline(state, {}, {}, {})).toEqual(pipeline.slice(0, 2));
    });

    it('should return an empty pipeline if selectedIndex is -1', () => {
      const pipeline: Pipeline = [
        { name: 'domain', domain: 'foo' },
        { name: 'rename', toRename: [['foo', 'bar']] },
        { name: 'rename', toRename: [['baz', 'spam']] },
      ];
      const state = buildStateWithOnePipeline(pipeline);
      expect(getters.inactivePipeline(state, {}, {}, {})).toEqual([]);
    });

    it('should return the rest of the pipeline if selectedIndex is specified', () => {
      const pipeline: Pipeline = [
        { name: 'domain', domain: 'foo' },
        { name: 'rename', toRename: [['foo', 'bar']] },
        { name: 'rename', toRename: [['baz', 'spam']] },
      ];
      const state = buildStateWithOnePipeline(pipeline, { selectedStepIndex: 1 });
      expect(getters.inactivePipeline(state, {}, {}, {})).toEqual(pipeline.slice(2));
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
      expect(getters.availableDatasetNames(state, {}, {}, {})).toEqual(['dataset1', 'dataset2']);
    });
    it('should return everything if the currentPipelineName is not defined', () => {
      const state = buildState({
        currentPipelineName: undefined,
        pipelines: {
          dataset1: [],
          dataset2: [],
        },
      });
      expect(getters.availableDatasetNames(state, {}, {}, {})).toEqual(['dataset1', 'dataset2']);
    });
    it('should return the pipeline names and the domains', () => {
      const state = buildState({
        pipelines: {
          dataset1: [],
          dataset2: [],
        },
        domains: ['domain1', 'domain2'],
      });
      expect(getters.availableDatasetNames(state, {}, {}, {})).toEqual([
        'dataset1',
        'dataset2',
        'domain1',
        'domain2',
      ]);
    });
    it('should sort the result: first pipelines ordered alphabetically, then domains ordered alphabetically', () => {
      const state = buildState({
        pipelines: {
          abc: [],
          xyz: [],
        },
        domains: ['mno', 'dataset1'],
      });
      expect(getters.availableDatasetNames(state, {}, {}, {})).toEqual([
        'abc',
        'xyz',
        'dataset1',
        'mno',
      ]);
    });
  });

  describe('referencingPipelines', () => {
    it('should return the referencing pipeline(s)', () => {
      const state = buildState({
        currentPipelineName: 'coco_l_asticot',
        pipelines: {
          coco_l_asticot: [{ name: 'domain', domain: 'dataset1' }],
          dataset1: [],
          dataset2: [{ name: 'domain', domain: 'coco_l_asticot' }],
        },
      });
      expect(getters.referencingPipelines(state, {}, {}, {})).toEqual(['dataset2']);
    });
    it('should return nothing if the currentPipelineName is not defined', () => {
      const state = buildState({
        currentPipelineName: undefined,
        pipelines: {
          dataset1: [],
          dataset2: [],
        },
      });
      expect(getters.referencingPipelines(state, {}, {}, {})).toEqual([]);
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
        { name: 'rename', toRename: [['foo', 'bar']] },
        { name: 'rename', toRename: [['baz', 'spam']] },
      ];
      const state = buildStateWithOnePipeline(pipeline);
      expect(getters.computedActiveStepIndex(state, {}, {}, {})).toEqual(2);
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
      expect(getters.computedActiveStepIndex(state, {}, {}, {})).toEqual(2);
    });

    it('should compute active step index if selectedIndex is specified', () => {
      const pipeline: Pipeline = [
        { name: 'domain', domain: 'foo' },
        { name: 'rename', toRename: [['foo', 'bar']] },
        { name: 'rename', toRename: [['baz', 'spam']] },
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

  describe('domain extraction tests', () => {
    it('should not return anything if no pipeline is selected', function() {
      const state = buildState({});
      expect(getters.domainStep(state, {}, {}, {})).toBeUndefined;
    });

    it('should return the domain step', () => {
      const pipeline: Pipeline = [
        { name: 'domain', domain: 'foo' },
        { name: 'rename', toRename: [['foo', 'bar']] },
        { name: 'rename', toRename: [['baz', 'spam']] },
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
        { name: 'rename', toRename: [['foo', 'bar']] },
        { name: 'rename', toRename: [['baz', 'spam']] },
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
        { name: 'rename', toRename: [['foo', 'bar']] },
        { name: 'rename', toRename: [['baz', 'spam']] },
      ];
      const state = buildStateWithOnePipeline(pipeline);
      expect(getters.stepConfig(state, {}, {}, {})(1)).toEqual(pipeline[1]);
    });

    it('should not return anything if there is no selected pipeline', function() {
      const state = buildState({});
      expect(getters.stepConfig(state, {}, {}, {})(0)).toBeUndefined();
    });
  });

  describe('step errors', () => {
    it('should return the error message if step index is found in errors', function() {
      const state = buildState({
        backendMessages: [{ type: 'error', message: 'lalalolilol', index: 3 }],
      });
      expect(getters.stepErrors(state, {}, {}, {})(3)).toStrictEqual('lalalolilol');
    });
    it('should return undefined if step index has no errors', function() {
      const state = buildState({
        backendMessages: [{ type: 'error', message: 'lalalolilol', index: 3 }],
      });
      expect(getters.stepErrors(state, {}, {}, {})(0)).toBeUndefined();
    });
    it('should return undefined if pipeline has no errors', function() {
      const state = buildState({});
      expect(getters.stepErrors(state, {}, {}, {})(0)).toBeUndefined();
    });
  });

  describe('message error related test', () => {
    it('should return false if backendError is undefined', () => {
      const state = buildState({ backendMessages: [] });
      expect(getters.thereIsABackendError(state, {}, {}, {})).toBeFalsy();
    });

    it('should return true if backendError is not undefined', () => {
      const state = buildState({ backendMessages: [{ type: 'error', message: 'error msg' }] });
      expect(getters.thereIsABackendError(state, {}, {}, {})).toBeTruthy();
    });
  });

  describe('translator', () => {
    it('should return the app translator', () => {
      const state = buildState({ translator: 'mongo40' });
      expect(getters.translator(state, {}, {}, {})).toEqual('mongo40');
    });
  });

  describe('unsupportedSteps', () => {
    it('should return the list of steps not supported by the translator', () => {
      const state = buildState({ translator: 'mongo36' });
      expect(getters.unsupportedSteps(state, {}, {}, {})).toEqual([
        'convert',
        'customsql',
        'dissolve',
        'trim',
      ]);
    });
  });

  describe('supportedSteps', () => {
    it('should return the list of steps supported by the translator', () => {
      const state = buildState({ translator: 'empty' });
      expect(getters.supportedSteps(state, {}, {}, {})).toEqual(['domain']);
    });
  });
});

describe('mutation tests', () => {
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
        paginationContext: { pageno: 2, pagesize: 10, totalCount: 10 },
      },
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

  describe('deleteSteps', function() {
    it('should do nothing if no pipeline is selected', () => {
      const state = buildState({});
      mutations.deleteSteps(state, { indexes: [1] });
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
          paginationContext: { pageno: 2, pagesize: 10, totalCount: 10 },
        },
      });
      mutations.deleteSteps(state, { indexes: [1, 3] });
      expect(currentPipeline(state)).toEqual([
        { name: 'domain', domain: 'foo' },
        { name: 'rename', toRename: [['baz', 'spam']] },
      ]);
      expect(state.selectedStepIndex).toEqual(1);
      // make sure the pagination is reset
      expect(state.dataset.paginationContext?.pageno).toEqual(1);
    });
  });

  describe('addSteps', function() {
    it('should do nothing if no pipeline is selected', () => {
      const state = buildState({});
      mutations.addSteps(state, {
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
          paginationContext: { pageno: 2, pagesize: 10, totalCount: 10 },
        },
      });
      mutations.selectStep(state, { index: 2 }); // select step 2
      mutations.addSteps(state, {
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
      expect(state.selectedStepIndex).toEqual(4);
      // make sure the pagination is reset
      expect(state.dataset.paginationContext?.pageno).toEqual(1);
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
          paginationContext: { pageno: 2, pagesize: 10, totalCount: 10 },
        },
      });
      mutations.selectStep(state, { index: -1 }); // select step -1
      mutations.addSteps(state, {
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
      expect(state.selectedStepIndex).toEqual(2);
      // make sure the pagination is reset
      expect(state.dataset.paginationContext?.pageno).toEqual(1);
    });
  });

  it('sets domain list', () => {
    const state = buildState({});
    expect(state.domains).toEqual([]);
    mutations.setDomains(state, { domains: ['foo', 'bar'] });
    expect(state.domains).toEqual(['foo', 'bar']);
  });

  it('sets queries list', () => {
    const state = buildState({});
    expect(state.queries).toEqual([]);
    mutations.setQueries(state, { queries: [{ uid: '1', name: 'Query 1' }] });
    expect(state.queries).toEqual([{ uid: '1', name: 'Query 1' }]);
  });

  it('sets currentPipelineName', () => {
    const state = buildState({
      dataset: {
        headers: [],
        data: [],
        paginationContext: { pageno: 2, pagesize: 10, totalCount: 10 },
      },
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
        dataset: {
          headers: [],
          data: [],
          paginationContext: { pageno: 2, pagesize: 10, totalCount: 10 },
        },
      });
      expect(getters.pipeline(state, {}, {}, {})).toEqual([]);

      const pipeline: Pipeline = [
        { name: 'domain', domain: 'foo' },
        { name: 'rename', toRename: [['foo', 'bar']] },
        { name: 'rename', toRename: [['baz', 'spam']] },
      ];
      mutations.setPipeline(state, { pipeline });
      expect(getters.pipeline(state, {}, {}, {})).toEqual(pipeline);
      // make sure the pagination is reset
      expect(state.dataset.paginationContext?.pageno).toEqual(1);
    });
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
        totalCount: 50,
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
    mutations.logBackendMessages(state, {
      backendMessages: [{ type: 'error', message: 'error msg' }],
    });
    expect(state.backendMessages).toEqual([{ type: 'error', message: 'error msg' }]);
    mutations.logBackendMessages(state, {
      backendMessages: [{ type: 'error', message: 'error msg 2' }],
    });
    expect(state.backendMessages).toEqual([{ type: 'error', message: 'error msg 2' }]);
  });

  it('set loading to true', () => {
    const state = buildState({});
    const type = 'dataset';
    mutations.setLoading(state, {
      type,
      isLoading: true,
    });
    expect(state.isLoading[type]).toEqual(true);
  });

  it('sets translator to true', () => {
    const state = buildState({ translator: 'mongo36' });
    mutations.setTranslator(state, {
      translator: 'mongo40',
    });
    expect(state.translator).toEqual('mongo40');
  });
});

describe('action tests', () => {
  it('selectPipeline', () => {
    const store = setupMockStore();
    const commitSpy = jest.spyOn(store, 'commit');
    const dispatchSpy = jest.spyOn(store, 'dispatch');
    store.dispatch(VQBnamespace('selectPipeline'), { name: 'chapopointu' });
    // It should update the current selected pipeline
    expect(commitSpy).toHaveBeenCalledWith(
      VQBnamespace('setCurrentPipelineName'),
      { name: 'chapopointu' },
      undefined,
    );
    // It should select the last step of that pipeline
    expect(commitSpy).toHaveBeenCalledWith(VQBnamespace('selectStep'), { index: -1 }, undefined);
    // It should update the preview of the dataset
    expect(dispatchSpy).toHaveBeenLastCalledWith(VQBnamespace('updateDataset'), undefined);
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
    let instantiateDummyService: Function;
    beforeEach(() => {
      instantiateDummyService = (): BackendService => ({
        executePipeline: jest.fn().mockResolvedValue({ data: dummyDataset }),
      });
    });
    it('should reset the preview if the pipeline is empty', async () => {
      const store = setupMockStore({
        ...buildStateWithOnePipeline([] as Pipeline),
        backendService: instantiateDummyService(),
      });
      const commitSpy = jest.spyOn(store, 'commit');
      await store.dispatch(VQBnamespace('updateDataset'));
      expect(commitSpy).toHaveBeenCalledWith(
        VQBnamespace('setDataset'),
        {
          dataset: {
            headers: [],
            data: [],
          },
        },
        undefined,
      );
    });
    it('updateDataset without error', async () => {
      const pipeline: Pipeline = [
        { name: 'domain', domain: 'GoT' },
        { name: 'replace', search_column: 'characters', to_replace: [['Snow', 'Targaryen']] },
        { name: 'sort', columns: [{ column: 'death', order: 'asc' }] },
      ];
      const store = setupMockStore({
        ...buildStateWithOnePipeline(pipeline),
        backendService: instantiateDummyService(),
      });
      const commitSpy = jest.spyOn(store, 'commit');

      await store.dispatch(VQBnamespace('updateDataset'));
      expect(commitSpy).toHaveBeenCalledTimes(7);
      // call 1 (clear backend messages) :
      expect(commitSpy.mock.calls[0][0]).toEqual(VQBnamespace('logBackendMessages'));
      expect(commitSpy.mock.calls[0][1]).toEqual({ backendMessages: [] });
      // call 2 :
      expect(commitSpy.mock.calls[1][0]).toEqual(VQBnamespace('setLoading'));
      expect(commitSpy.mock.calls[1][1]).toEqual({ type: 'dataset', isLoading: true });
      // call 3 :
      expect(commitSpy.mock.calls[2][0]).toEqual(VQBnamespace('toggleRequestOnGoing'));
      expect(commitSpy.mock.calls[2][1]).toEqual({ isRequestOnGoing: true });
      // call 4 :
      expect(commitSpy.mock.calls[3][0]).toEqual(VQBnamespace('logBackendMessages'));
      expect(commitSpy.mock.calls[3][1]).toEqual({ backendMessages: [] });
      // call 5 :
      expect(commitSpy.mock.calls[4][0]).toEqual(VQBnamespace('setDataset'));
      expect(commitSpy.mock.calls[4][1]).toEqual({ dataset: dummyDatasetWithUniqueComputed });
      // call 6 :
      expect(commitSpy.mock.calls[5][0]).toEqual(VQBnamespace('toggleRequestOnGoing'));
      expect(commitSpy.mock.calls[5][1]).toEqual({ isRequestOnGoing: false });
      // call 7 :
      expect(commitSpy.mock.calls[6][0]).toEqual(VQBnamespace('setLoading'));
      expect(commitSpy.mock.calls[6][1]).toEqual({ type: 'dataset', isLoading: false });
    });

    it('updateDataset with error from service', async () => {
      const pipeline: Pipeline = [
        { name: 'domain', domain: 'GoT' },
        { name: 'replace', search_column: 'characters', to_replace: [['Snow', 'Targaryen']] },
        { name: 'sort', columns: [{ column: 'death', order: 'asc' }] },
      ];
      const store = setupMockStore({
        ...buildStateWithOnePipeline(pipeline),
        backendService: {
          executePipeline: jest.fn().mockResolvedValue({
            error: [{ type: 'error' as 'error', message: 'OMG an error happens' }],
          }),
        },
      });
      const commitSpy = jest.spyOn(store, 'commit');

      await store.dispatch(VQBnamespace('updateDataset'));
      expect(commitSpy).toHaveBeenCalledTimes(6);
      // call 1 (clear backend messages) :
      expect(commitSpy.mock.calls[0][0]).toEqual(VQBnamespace('logBackendMessages'));
      expect(commitSpy.mock.calls[0][1]).toEqual({ backendMessages: [] });
      // call 2 :
      expect(commitSpy.mock.calls[1][0]).toEqual(VQBnamespace('setLoading'));
      expect(commitSpy.mock.calls[1][1]).toEqual({ type: 'dataset', isLoading: true });
      // call 3 :
      expect(commitSpy.mock.calls[2][0]).toEqual(VQBnamespace('toggleRequestOnGoing'));
      expect(commitSpy.mock.calls[2][1]).toEqual({ isRequestOnGoing: true });
      // call 4 :
      expect(commitSpy.mock.calls[3][0]).toEqual(VQBnamespace('logBackendMessages'));
      expect(commitSpy.mock.calls[3][1]).toEqual({
        backendMessages: [{ message: 'OMG an error happens', type: 'error' }],
      });
      // call 5 :
      expect(commitSpy.mock.calls[4][0]).toEqual(VQBnamespace('toggleRequestOnGoing'));
      expect(commitSpy.mock.calls[4][1]).toEqual({ isRequestOnGoing: false });
      // call 6 :
      expect(commitSpy.mock.calls[5][0]).toEqual(VQBnamespace('setLoading'));
      expect(commitSpy.mock.calls[5][1]).toEqual({ type: 'dataset', isLoading: false });
    });

    it('updateDataset with uncaught error from service', async () => {
      const pipeline: Pipeline = [
        { name: 'domain', domain: 'GoT' },
        { name: 'replace', search_column: 'characters', to_replace: [['Snow', 'Targaryen']] },
        { name: 'sort', columns: [{ column: 'death', order: 'asc' }] },
      ];
      const store = setupMockStore({
        ...buildStateWithOnePipeline(pipeline),
        backendService: {
          executePipeline: jest.fn().mockRejectedValue('Katastrophe!'),
        },
      });
      const commitSpy = jest.spyOn(store, 'commit');

      try {
        await store.dispatch(VQBnamespace('updateDataset'));
      } catch (e) {
        expect(e).toEqual('Katastrophe!');
      }

      expect(commitSpy).toHaveBeenCalledTimes(6);
      // call 1 (clear backend messages) :
      expect(commitSpy.mock.calls[0][0]).toEqual(VQBnamespace('logBackendMessages'));
      expect(commitSpy.mock.calls[0][1]).toEqual({ backendMessages: [] });
      // call 2 :
      expect(commitSpy.mock.calls[1][0]).toEqual(VQBnamespace('setLoading'));
      expect(commitSpy.mock.calls[1][1]).toEqual({ type: 'dataset', isLoading: true });
      // call 3 :
      expect(commitSpy.mock.calls[2][0]).toEqual(VQBnamespace('toggleRequestOnGoing'));
      expect(commitSpy.mock.calls[2][1]).toEqual({ isRequestOnGoing: true });
      // call 4 :
      expect(commitSpy.mock.calls[3][0]).toEqual(VQBnamespace('logBackendMessages'));
      expect(commitSpy.mock.calls[3][1]).toEqual({
        backendMessages: [{ message: 'Katastrophe!', type: 'error' }],
      });
      // call 5 :
      expect(commitSpy.mock.calls[4][0]).toEqual(VQBnamespace('toggleRequestOnGoing'));
      expect(commitSpy.mock.calls[4][1]).toEqual({ isRequestOnGoing: false });
      // call 6 :
      expect(commitSpy.mock.calls[5][0]).toEqual(VQBnamespace('setLoading'));
      expect(commitSpy.mock.calls[5][1]).toEqual({ type: 'dataset', isLoading: false });
    });

    it('updateDataset with specific step error from service', async () => {
      const pipeline: Pipeline = [
        { name: 'domain', domain: 'GoT' },
        { name: 'replace', search_column: 'characters', to_replace: [['Snow', 'Targaryen']] },
        { name: 'sort', columns: [{ column: 'death', order: 'asc' }] },
      ];
      const store = setupMockStore({
        ...buildStateWithOnePipeline(pipeline),
        backendService: {
          executePipeline: jest.fn().mockResolvedValue({
            error: [{ type: 'error' as 'error', index: 1, message: 'Specific error for step' }],
          }),
        },
      });
      const commitSpy = jest.spyOn(store, 'commit');

      await store.dispatch(VQBnamespace('updateDataset'));
      expect(commitSpy).toHaveBeenCalledTimes(6);
      // call 1 (clear backend messages) :
      expect(commitSpy.mock.calls[0][0]).toEqual(VQBnamespace('logBackendMessages'));
      expect(commitSpy.mock.calls[0][1]).toEqual({ backendMessages: [] });
      // call 2 :
      expect(commitSpy.mock.calls[1][0]).toEqual(VQBnamespace('setLoading'));
      expect(commitSpy.mock.calls[1][1]).toEqual({ type: 'dataset', isLoading: true });
      // call 3 :
      expect(commitSpy.mock.calls[2][0]).toEqual(VQBnamespace('toggleRequestOnGoing'));
      expect(commitSpy.mock.calls[2][1]).toEqual({ isRequestOnGoing: true });
      // call 4 :
      expect(commitSpy.mock.calls[3][0]).toEqual(VQBnamespace('logBackendMessages'));
      expect(commitSpy.mock.calls[3][1]).toEqual({
        backendMessages: [{ type: 'error', index: 1, message: 'Specific error for step' }],
      });
      // call 5 :
      expect(commitSpy.mock.calls[4][0]).toEqual(VQBnamespace('toggleRequestOnGoing'));
      expect(commitSpy.mock.calls[4][1]).toEqual({ isRequestOnGoing: false });
      // call 6 :
      expect(commitSpy.mock.calls[5][0]).toEqual(VQBnamespace('setLoading'));
      expect(commitSpy.mock.calls[5][1]).toEqual({ type: 'dataset', isLoading: false });
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
    let instantiateDummyService: Function;
    beforeEach(() => {
      instantiateDummyService = (): BackendService => ({
        executePipeline: jest.fn().mockResolvedValue({ data: resultOfAggregationCountOnCity }),
      });
    });

    it('should not call anything if pipeline is empty', async () => {
      const dummyService = instantiateDummyService();
      const store = setupMockStore({
        ...buildStateWithOnePipeline([], { dataset: dummyDataset }),
        backendService: dummyService,
      });
      const commitSpy = jest.spyOn(store, 'commit');
      await store.dispatch(VQBnamespace('loadColumnUniqueValues'), { column: 'city' });
      expect(commitSpy).toHaveBeenCalledTimes(2);
      // call 1:
      expect(commitSpy.mock.calls[0][0]).toEqual(VQBnamespace('setLoading'));
      expect(commitSpy.mock.calls[0][1]).toEqual({ type: 'uniqueValues', isLoading: true });
      // call 2:
      expect(commitSpy.mock.calls[1][0]).toEqual(VQBnamespace('setLoading'));
      expect(commitSpy.mock.calls[1][1]).toEqual({ type: 'uniqueValues', isLoading: false });
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
              aggfunction: 'count' as 'count',
              newcolumns: ['__vqb_count__'],
            },
          ],
          on: ['city'],
        },
      ];
      const commitSpy = jest.spyOn(store, 'commit');
      await store.dispatch(VQBnamespace('loadColumnUniqueValues'), { column: 'city' });
      expect(dummyService.executePipeline).toHaveBeenCalledWith(
        expectedPipeline,
        expect.objectContaining({ default_pipeline: pipeline }),
      );
      expect(commitSpy).toHaveBeenCalledTimes(3);
      // call 1:
      expect(commitSpy.mock.calls[0][0]).toEqual(VQBnamespace('setLoading'));
      expect(commitSpy.mock.calls[0][1]).toEqual({ type: 'uniqueValues', isLoading: true });
      // call 2:
      expect(commitSpy.mock.calls[1][0]).toEqual(VQBnamespace('setDataset'));
      expect(commitSpy.mock.calls[1][1]).toEqual({
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
      expect(commitSpy.mock.calls[2][0]).toEqual(VQBnamespace('setLoading'));
      expect(commitSpy.mock.calls[2][1]).toEqual({ type: 'uniqueValues', isLoading: false });
    });
  });

  describe('setAvailableVariables', function() {
    it('set available variables', () => {
      const state = buildState({});
      const availableVariables = [
        { identifier: 'var1', value: 1, label: 'First variable' },
        { identifier: 'var2', value: 2, label: 'Second variable' },
      ];
      mutations.setAvailableVariables(state, { availableVariables });
      expect(state.availableVariables).toEqual(availableVariables);
    });
  });

  describe('setVariableDelimiters', function() {
    it('set variable delimiters', () => {
      const state = buildState({});
      const variableDelimiters = { start: '{{', end: '}}' };
      mutations.setVariableDelimiters(state, { variableDelimiters });
      expect(state.variableDelimiters).toEqual(variableDelimiters);
    });
  });

  describe('setBackendService', function() {
    it('set the backend service', () => {
      const state = buildState({});
      const backendService = {
        executePipeline: jest.fn(),
      } as BackendService;
      mutations.setBackendService(state, { backendService });
      expect(state.backendService).toEqual(backendService);
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
    let store: Store<RootState>, mockBackendServiceExecutePipeline: jest.Mock;

    beforeEach(() => {
      mockBackendServiceExecutePipeline = jest.fn();

      store = setupMockStore(
        buildState({
          backendService: {
            executePipeline: mockBackendServiceExecutePipeline,
          },
          currentPipelineName: 'coco_l_asticot',
          pipelines: {
            coco_l_asticot: [
              { name: 'domain', domain: 'plop' },
              { name: 'text', new_column: 'yolo', text: 'asticot' },
            ],
            dataset1: [],
            dataset2: [],
          },
        }),
      );
    });

    it('should not return anything if no pipeline name or domain is provided', async () => {
      expect(await store.dispatch(VQBnamespace('getColumnNamesFromPipeline'))).toBeUndefined();
      expect(mockBackendServiceExecutePipeline).not.toHaveBeenCalled();
    });

    it('should return the column names from an existing pipeline', async () => {
      mockBackendServiceExecutePipeline.mockResolvedValue({
        data: { headers: [{ name: 'A' }, { name: 'B' }, { name: 'C' }] },
      });
      expect(
        await store.dispatch(VQBnamespace('getColumnNamesFromPipeline'), 'coco_l_asticot'),
      ).toEqual(['A', 'B', 'C']);
      expect(mockBackendServiceExecutePipeline).toHaveBeenLastCalledWith(
        [
          { name: 'domain', domain: 'plop' },
          { name: 'text', new_column: 'yolo', text: 'asticot' },
        ],
        {
          coco_l_asticot: [
            { name: 'domain', domain: 'plop' },
            { name: 'text', new_column: 'yolo', text: 'asticot' },
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
      expect(await store.dispatch(VQBnamespace('getColumnNamesFromPipeline'), 'other')).toEqual([
        'meow',
        'ouaf',
      ]);
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
            { name: 'text', new_column: 'yolo', text: 'asticot' },
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
