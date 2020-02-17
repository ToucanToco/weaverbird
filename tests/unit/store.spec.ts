import { Pipeline } from '@/lib/steps';
import getters from '@/store/getters';
import mutations from '@/store/mutations';
import { emptyState } from '@/store/state';

import { buildState, buildStateWithOnePipeline } from './utils';

describe('getter tests', () => {
  describe('(in)active pipeline steps', () => {
    it('should return the whole pipeline if selectedIndex is -1', () => {
      const pipeline: Pipeline = [
        { name: 'domain', domain: 'foo' },
        { name: 'rename', oldname: 'foo', newname: 'bar' },
        { name: 'rename', oldname: 'baz', newname: 'spam' },
      ];
      const state = buildState(buildStateWithOnePipeline(pipeline));
      expect(getters.activePipeline(state, {}, {}, {})).toEqual(pipeline);
    });

    it('should return a partial pipeline if selectedIndex is specified', () => {
      const pipeline: Pipeline = [
        { name: 'domain', domain: 'foo' },
        { name: 'rename', oldname: 'foo', newname: 'bar' },
        { name: 'rename', oldname: 'baz', newname: 'spam' },
      ];
      const state = buildState(buildStateWithOnePipeline(pipeline, { selectedStepIndex: 1 }));
      expect(getters.activePipeline(state, {}, {}, {})).toEqual(pipeline.slice(0, 2));
    });

    it('should return an empty pipeline if selectedIndex is -1', () => {
      const pipeline: Pipeline = [
        { name: 'domain', domain: 'foo' },
        { name: 'rename', oldname: 'foo', newname: 'bar' },
        { name: 'rename', oldname: 'baz', newname: 'spam' },
      ];
      const state = buildState(buildStateWithOnePipeline(pipeline));
      expect(getters.inactivePipeline(state, {}, {}, {})).toEqual([]);
    });

    it('should return the rest of the pipeline if selectedIndex is specified', () => {
      const pipeline: Pipeline = [
        { name: 'domain', domain: 'foo' },
        { name: 'rename', oldname: 'foo', newname: 'bar' },
        { name: 'rename', oldname: 'baz', newname: 'spam' },
      ];
      const state = buildState(buildStateWithOnePipeline(pipeline, { selectedStepIndex: 1 }));
      expect(getters.inactivePipeline(state, {}, {}, {})).toEqual(pipeline.slice(2));
    });
  });

  describe('active step index tests', () => {
    it('should compute active step index if selectedIndex is -1', () => {
      const pipeline: Pipeline = [
        { name: 'domain', domain: 'foo' },
        { name: 'rename', oldname: 'foo', newname: 'bar' },
        { name: 'rename', oldname: 'baz', newname: 'spam' },
      ];
      const state = buildState(buildStateWithOnePipeline(pipeline));
      expect(getters.computedActiveStepIndex(state, {}, {}, {})).toEqual(2);
    });

    it('should compute active step index if selectedIndex is specified', () => {
      const pipeline: Pipeline = [
        { name: 'domain', domain: 'foo' },
        { name: 'rename', oldname: 'foo', newname: 'bar' },
        { name: 'rename', oldname: 'baz', newname: 'spam' },
      ];
      const state = buildState(buildStateWithOnePipeline(pipeline, { selectedStepIndex: 1 }));
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
    it('should return the domain step', () => {
      const pipeline: Pipeline = [
        { name: 'domain', domain: 'foo' },
        { name: 'rename', oldname: 'foo', newname: 'bar' },
        { name: 'rename', oldname: 'baz', newname: 'spam' },
      ];
      const state = buildState(buildStateWithOnePipeline(pipeline));
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
    it('should return true if pipeline is empty', () => {
      const pipeline: Pipeline = [];
      const state = buildState(buildStateWithOnePipeline(pipeline));
      expect(getters.isPipelineEmpty(state, {}, {}, {})).toBeTruthy();
    });

    it('should return false if pipeline is not empty', () => {
      const pipeline: Pipeline = [
        { name: 'domain', domain: 'foo' },
        { name: 'rename', oldname: 'foo', newname: 'bar' },
        { name: 'rename', oldname: 'baz', newname: 'spam' },
      ];
      const state = buildState(buildStateWithOnePipeline(pipeline));
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
    const state = buildState(buildStateWithOnePipeline(pipeline));
    expect(state.selectedStepIndex).toEqual(-1);
    mutations.selectStep(state, { index: 2 });
    expect(state.selectedStepIndex).toEqual(2);

    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    mutations.selectStep(state, { index: 5 });
    expect(spy).toHaveBeenCalled();
    expect(state.selectedStepIndex).toEqual(-1);
    spy.mockRestore();
  });

  it('sets current domain on empty pipeline', () => {
    const state = buildState({ currentDomain: 'foo' });
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
    const state = buildState({ currentDomain: 'foo', ...buildStateWithOnePipeline(pipeline) });
    expect(state.currentDomain).toEqual('foo');
    mutations.setCurrentDomain(state, { currentDomain: 'bar' });
    expect(state.currentDomain).toEqual('bar');
    expect(getters.pipeline(state, {}, {}, {})).toEqual([
      { name: 'domain', domain: 'bar' },
      { name: 'rename', oldname: 'foo', newname: 'bar' },
      { name: 'rename', oldname: 'baz', newname: 'spam' },
    ]);
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
    const state = buildState({});
    mutations.setCurrentPipelineName(state, { name: 'bar' });
    expect(state.currentPipelineName).toEqual('bar');
  });

  it('sets pipeline', () => {
    const pipeline: Pipeline = [
      { name: 'domain', domain: 'foo' },
      { name: 'rename', oldname: 'foo', newname: 'bar' },
      { name: 'rename', oldname: 'baz', newname: 'spam' },
    ];
    const state = buildState({});
    expect(getters.pipeline(state, {}, {}, {})).toEqual([]);
    mutations.setPipeline(state, { pipeline });
    expect(getters.pipeline(state, {}, {}, {})).toEqual(pipeline);
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
});
