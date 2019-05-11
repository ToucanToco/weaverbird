import { Pipeline } from '@/lib/steps';
import { VQBState, emptyState } from '@/store/state';
import getters from '@/store/getters';
import mutations from '@/store/mutations';

function buildState(customState: Partial<VQBState>) {
  return {
    ...emptyState,
    ...customState,
  };
}

describe('getter tests', () => {
  describe('(in)active pipeline steps', () => {
    it('should return the whole pipeline if selectedIndex is -1', () => {
      const pipeline: Pipeline = [
        { name: 'domain', domain: 'foo' },
        { name: 'rename', oldname: 'foo', newname: 'bar' },
        { name: 'rename', oldname: 'baz', newname: 'spam' },
      ];
      const state = buildState({ pipeline });
      expect(getters.activePipeline(state)).toEqual(pipeline);
    });

    it('should return a partial pipeline if selectedIndex is specified', () => {
      const pipeline: Pipeline = [
        { name: 'domain', domain: 'foo' },
        { name: 'rename', oldname: 'foo', newname: 'bar' },
        { name: 'rename', oldname: 'baz', newname: 'spam' },
      ];
      const state = buildState({ pipeline, selectedStepIndex: 1 });
      expect(getters.activePipeline(state)).toEqual(pipeline.slice(0, 2));
    });

    it('should return an empty pipeline if selectedIndex is -1', () => {
      const pipeline: Pipeline = [
        { name: 'domain', domain: 'foo' },
        { name: 'rename', oldname: 'foo', newname: 'bar' },
        { name: 'rename', oldname: 'baz', newname: 'spam' },
      ];
      const state = buildState({ pipeline });
      expect(getters.inactivePipeline(state)).toEqual([]);
    });

    it('should return the rest of the pipeline if selectedIndex is specified', () => {
      const pipeline: Pipeline = [
        { name: 'domain', domain: 'foo' },
        { name: 'rename', oldname: 'foo', newname: 'bar' },
        { name: 'rename', oldname: 'baz', newname: 'spam' },
      ];
      const state = buildState({ pipeline, selectedStepIndex: 1 });
      expect(getters.inactivePipeline(state)).toEqual(pipeline.slice(2));
    });
  });

  describe('active step index tests', () => {
    it('should compute active step index if selectedIndex is -1', () => {
      const pipeline: Pipeline = [
        { name: 'domain', domain: 'foo' },
        { name: 'rename', oldname: 'foo', newname: 'bar' },
        { name: 'rename', oldname: 'baz', newname: 'spam' },
      ];
      const state = buildState({ pipeline });
      expect(getters.computedActiveStepIndex(state)).toEqual(2);
    });

    it('should compute active step index if selectedIndex is specified', () => {
      const pipeline: Pipeline = [
        { name: 'domain', domain: 'foo' },
        { name: 'rename', oldname: 'foo', newname: 'bar' },
        { name: 'rename', oldname: 'baz', newname: 'spam' },
      ];
      const state = buildState({ pipeline, selectedStepIndex: 1 });
      expect(getters.computedActiveStepIndex(state)).toEqual(1);
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
      expect(getters.columnNames(state)).toEqual(['col1', 'col2']);
    });

    it('should be able to handle empty headers', () => {
      const state = buildState({
        dataset: {
          headers: [],
          data: [],
        },
      });
      expect(getters.columnNames(state)).toEqual([]);
    });
  });

  describe('domain extraction tests', () => {
    it('should return the domain step', () => {
      const pipeline: Pipeline = [
        { name: 'domain', domain: 'foo' },
        { name: 'rename', oldname: 'foo', newname: 'bar' },
        { name: 'rename', oldname: 'baz', newname: 'spam' },
      ];
      const state = buildState({ pipeline });
      expect(getters.domainStep(state)).toEqual(pipeline[0]);
    });

    it('should return all the steps except the domain step', () => {
      const pipeline: Pipeline = [
        { name: 'domain', domain: 'foo' },
        { name: 'rename', oldname: 'foo', newname: 'bar' },
        { name: 'rename', oldname: 'baz', newname: 'spam' },
      ];
      const state = buildState({ pipeline });
      expect(getters.stepsWithoutDomain(state)).toEqual(pipeline.slice(1));
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
      expect(getters.isDatasetEmpty(state)).toBeTruthy();
    });

    it('should return false if dataset is not empty', () => {
      const state = buildState({
        dataset: {
          headers: [{ name: 'col1' }, { name: 'col2' }],
          data: [[0, 0]],
        },
      });
      expect(getters.isDatasetEmpty(state)).toBeFalsy();
    });
  });

  describe('pipeline empty tests', () => {
    it('should return true if pipeline is empty', () => {
      const pipeline: Pipeline = [];
      const state = buildState({ pipeline });
      expect(getters.isPipelineEmpty(state)).toBeTruthy();
    });

    it('should return false if pipeline is not empty', () => {
      const pipeline: Pipeline = [
        { name: 'domain', domain: 'foo' },
        { name: 'rename', oldname: 'foo', newname: 'bar' },
        { name: 'rename', oldname: 'baz', newname: 'spam' },
      ];
      const state = buildState({ pipeline });
      expect(getters.isPipelineEmpty(state)).toBeFalsy();
    });
  });

  describe('step disabled tests', () => {
    it('should return false if selected step is not specified or -1', () => {
      let state = buildState({});
      expect(getters.isStepDisabled(state)(0)).toBeFalsy();
      expect(getters.isStepDisabled(state)(1)).toBeFalsy();
      state = buildState({ selectedStepIndex: -1 });
      expect(getters.isStepDisabled(state)(0)).toBeFalsy();
      expect(getters.isStepDisabled(state)(1)).toBeFalsy();
    });

    it('should return false if selected step index is greater than index', () => {
      const state = buildState({ selectedStepIndex: 1 });
      expect(getters.isStepDisabled(state)(0)).toBeFalsy();
      expect(getters.isStepDisabled(state)(1)).toBeFalsy();
    });

    it('should return true if selected step index is lower than index', () => {
      const state = buildState({ selectedStepIndex: 1 });
      expect(getters.isStepDisabled(state)(2)).toBeTruthy();
      expect(getters.isStepDisabled(state)(3)).toBeTruthy();
    });
  });
});

describe('mutation tests', () => {
  it('selects step', () => {
    const state = buildState({});
    expect(state.selectedStepIndex).toEqual(-1);
    mutations.selectStep(state, { index: 2 });
    expect(state.selectedStepIndex).toEqual(2);
  });

  it('sets current domain', () => {
    const state = buildState({ currentDomain: 'foo' });
    expect(state.currentDomain).toEqual('foo');
    mutations.setCurrentDomain(state, { currentDomain: 'bar' });
    expect(state.currentDomain).toEqual('bar');
  });

  it('sets domain list', () => {
    const state = buildState({});
    expect(state.domains).toEqual([]);
    mutations.setDomains(state, { domains: ['foo', 'bar'] });
    expect(state.domains).toEqual(['foo', 'bar']);
  });

  it('sets pipeline', () => {
    const pipeline: Pipeline = [
      { name: 'domain', domain: 'foo' },
      { name: 'rename', oldname: 'foo', newname: 'bar' },
      { name: 'rename', oldname: 'baz', newname: 'spam' },
    ];
    const state = buildState({});
    expect(state.pipeline).toEqual([]);
    mutations.setPipeline(state, { pipeline });
    expect(state.pipeline).toEqual(pipeline);
  });

  it('sets dataset', () => {
    const dataset = {
      headers: [{ name: 'col1' }, { name: 'col2' }],
      data: [[0, 0]],
    };
    const state = buildState({});
    expect(state.dataset).toEqual({ headers: [], data: [] });
    mutations.setDataset(state, { dataset });
    expect(state.dataset).toEqual(dataset);
  });
});
