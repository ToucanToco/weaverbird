import sinon from 'sinon';
import { expect } from 'chai';
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
      expect(getters.activePipeline(state)).to.eql(pipeline);
    });

    it('should return a partial pipeline if selectedIndex is specified', () => {
      const pipeline: Pipeline = [
        { name: 'domain', domain: 'foo' },
        { name: 'rename', oldname: 'foo', newname: 'bar' },
        { name: 'rename', oldname: 'baz', newname: 'spam' },
      ];
      const state = buildState({ pipeline, selectedStepIndex: 1 });
      expect(getters.activePipeline(state)).to.eql(pipeline.slice(0, 2));
    });

    it('should return an empty pipeline if selectedIndex is -1', () => {
      const pipeline: Pipeline = [
        { name: 'domain', domain: 'foo' },
        { name: 'rename', oldname: 'foo', newname: 'bar' },
        { name: 'rename', oldname: 'baz', newname: 'spam' },
      ];
      const state = buildState({ pipeline });
      expect(getters.inactivePipeline(state)).to.eql([]);
    });

    it('should return the rest of the pipeline if selectedIndex is specified', () => {
      const pipeline: Pipeline = [
        { name: 'domain', domain: 'foo' },
        { name: 'rename', oldname: 'foo', newname: 'bar' },
        { name: 'rename', oldname: 'baz', newname: 'spam' },
      ];
      const state = buildState({ pipeline, selectedStepIndex: 1 });
      expect(getters.inactivePipeline(state)).to.eql(pipeline.slice(2));
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
      expect(getters.computedActiveStepIndex(state)).to.equal(2);
    });

    it('should compute active step index if selectedIndex is specified', () => {
      const pipeline: Pipeline = [
        { name: 'domain', domain: 'foo' },
        { name: 'rename', oldname: 'foo', newname: 'bar' },
        { name: 'rename', oldname: 'baz', newname: 'spam' },
      ];
      const state = buildState({ pipeline, selectedStepIndex: 1 });
      expect(getters.computedActiveStepIndex(state)).to.equal(1);
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
      expect(getters.columnNames(state)).to.eql(['col1', 'col2']);
    });

    it('should be able to handle empty headers', () => {
      const state = buildState({
        dataset: {
          headers: [],
          data: [],
        },
      });
      expect(getters.columnNames(state)).to.eql([]);
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
      expect(getters.domainStep(state)).to.eql(pipeline[0]);
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
      expect(getters.isDatasetEmpty(state)).to.be.true;
    });

    it('should return false if dataset is not empty', () => {
      const state = buildState({
        dataset: {
          headers: [{ name: 'col1' }, { name: 'col2' }],
          data: [[0, 0]],
        },
      });
      expect(getters.isDatasetEmpty(state)).to.be.false;
    });
  });

  describe('pipeline empty tests', () => {
    it('should return true if pipeline is empty', () => {
      const pipeline: Pipeline = [];
      const state = buildState({ pipeline });
      expect(getters.isPipelineEmpty(state)).to.be.true;
    });

    it('should return false if pipeline is not empty', () => {
      const pipeline: Pipeline = [
        { name: 'domain', domain: 'foo' },
        { name: 'rename', oldname: 'foo', newname: 'bar' },
        { name: 'rename', oldname: 'baz', newname: 'spam' },
      ];
      const state = buildState({ pipeline });
      expect(getters.isPipelineEmpty(state)).to.be.false;
    });
  });

  describe('step disabled tests', () => {
    it('should return false if selected step is not specified or -1', () => {
      let state = buildState({});
      expect(getters.isStepDisabled(state)(0)).to.be.false;
      expect(getters.isStepDisabled(state)(1)).to.be.false;
      state = buildState({ selectedStepIndex: -1 });
      expect(getters.isStepDisabled(state)(0)).to.be.false;
      expect(getters.isStepDisabled(state)(1)).to.be.false;
    });

    it('should return false if selected step index is greater than index', () => {
      const state = buildState({ selectedStepIndex: 1 });
      expect(getters.isStepDisabled(state)(0)).to.be.false;
      expect(getters.isStepDisabled(state)(1)).to.be.false;
    });

    it('should return true if selected step index is lower than index', () => {
      const state = buildState({ selectedStepIndex: 1 });
      expect(getters.isStepDisabled(state)(2)).to.be.true;
      expect(getters.isStepDisabled(state)(3)).to.be.true;
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
    const state = buildState({ pipeline });
    expect(state.selectedStepIndex).to.equal(-1);
    mutations.selectStep(state, { index: 2 });
    expect(state.selectedStepIndex).to.equal(2);

    const spy = sinon.spy(console, 'error');
    mutations.selectStep(state, { index: 5 });
    sinon.assert.called(spy);
    expect(state.selectedStepIndex).to.equal(-1);
  });

  it('sets current domain on empty pipeline', () => {
    const state = buildState({ currentDomain: 'foo' });
    expect(state.currentDomain).to.equal('foo');
    mutations.setCurrentDomain(state, { currentDomain: 'bar' });
    expect(state.currentDomain).to.equal('bar');
    expect(state.pipeline).to.eql([{ name: 'domain', domain: 'bar' }]);
  });

  it('sets current domain on non empty pipeline', () => {
    const pipeline: Pipeline = [
      { name: 'domain', domain: 'foo' },
      { name: 'rename', oldname: 'foo', newname: 'bar' },
      { name: 'rename', oldname: 'baz', newname: 'spam' },
    ];
    const state = buildState({ currentDomain: 'foo', pipeline });
    expect(state.currentDomain).to.equal('foo');
    mutations.setCurrentDomain(state, { currentDomain: 'bar' });
    expect(state.currentDomain).to.equal('bar');
    expect(state.pipeline).to.eql([
      { name: 'domain', domain: 'bar' },
      { name: 'rename', oldname: 'foo', newname: 'bar' },
      { name: 'rename', oldname: 'baz', newname: 'spam' },
    ]);
  });

  it('sets domain list', () => {
    const state = buildState({});
    expect(state.domains).to.eql([]);
    mutations.setDomains(state, { domains: ['foo', 'bar'] });
    expect(state.domains).to.eql(['foo', 'bar']);
  });

  it('sets pipeline', () => {
    const pipeline: Pipeline = [
      { name: 'domain', domain: 'foo' },
      { name: 'rename', oldname: 'foo', newname: 'bar' },
      { name: 'rename', oldname: 'baz', newname: 'spam' },
    ];
    const state = buildState({});
    expect(state.pipeline).to.eql([]);
    mutations.setPipeline(state, { pipeline });
    expect(state.pipeline).to.eql(pipeline);
  });

  it('sets dataset', () => {
    const dataset = {
      headers: [{ name: 'col1' }, { name: 'col2' }],
      data: [[0, 0]],
    };
    const state = buildState({});
    expect(state.dataset).to.eql({ headers: [], data: [] });
    mutations.setDataset(state, { dataset });
    expect(state.dataset).to.eql(dataset);
  });

  it('toggles step edition mode', () => {
    const state = buildState({ isEditingStep: true });
    mutations.toggleStepEdition(state);
    expect(state.isEditingStep).to.be.false;
    mutations.toggleStepEdition(state);
    expect(state.isEditingStep).to.be.true;
  });
});
