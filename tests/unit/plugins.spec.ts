import { createLocalVue, mount } from '@vue/test-utils';
import Vuex from 'vuex';
import flushPromises from 'flush-promises';

import { Pipeline } from '@/lib/steps';
import { setupStore } from '@/store';
// eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
import { BackendService, servicePluginFactory } from '@/store/backend-plugin';
import PipelineComponent from '@/components/Pipeline.vue';

const localVue = createLocalVue();
localVue.use(Vuex);

class DummyService implements BackendService {
  listCollections() {
    return Promise.resolve(['foo', 'bar']);
  }

  // eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
  executePipeline(pipeline: Pipeline, limit: number, _offset: number) {
    let rset = [[1, 2], [3, 4]];
    if (limit) {
      rset = rset.slice(0, limit);
    }
    return Promise.resolve({
      headers: [{ name: 'x' }, { name: 'y' }],
      data: rset,
    });
  }
}

describe('backend service plugin tests', () => {
  it('should call execute pipeline when a step is clicked on', async () => {
    const pipeline: Pipeline = [
      { name: 'domain', domain: 'GoT' },
      { name: 'replace', search_column: 'characters', to_replace: [['Snow', 'Targaryen']] },
      { name: 'sort', columns: [{ column: 'death', order: 'asc' }] },
    ];
    const store = setupStore({ pipeline }, [servicePluginFactory(new DummyService())]);
    const wrapper = mount(PipelineComponent, { store, localVue });
    wrapper.find('.query-pipeline-queue__dot').trigger('click');
    await flushPromises();
    expect(store.state.dataset).toEqual({
      headers: [{ name: 'x' }, { name: 'y' }],
      data: [[1, 2], [3, 4]],
    });
  });

  it('should call execute pipeline when a selectStep mutation is committed', async () => {
    const pipeline: Pipeline = [
      { name: 'domain', domain: 'foo' },
      { name: 'rename', oldname: 'foo', newname: 'bar' },
      { name: 'rename', oldname: 'baz', newname: 'spam' },
      { name: 'rename', oldname: 'tic', newname: 'tac' },
    ];
    const store = setupStore(
      {
        pipeline,
        selectedStepIndex: 1,
      },
      [servicePluginFactory(new DummyService())],
    );
    store.commit('selectStep', { index: 2 });
    await flushPromises();
    expect(store.state.dataset).toEqual({
      headers: [{ name: 'x' }, { name: 'y' }],
      data: [[1, 2], [3, 4]],
    });
  });

  it('should call execute pipeline when a setCurrentDomain mutation is committed', async () => {
    const store = setupStore({}, [servicePluginFactory(new DummyService())]);
    store.commit('setCurrentDomain', { currentDomain: 'GoT' });
    await flushPromises();
    expect(store.state.dataset).toEqual({
      headers: [{ name: 'x' }, { name: 'y' }],
      data: [[1, 2], [3, 4]],
    });
  });

  it('should call execute pipeline when a deleteStep mutation is committed', async () => {
    const store = setupStore({}, [servicePluginFactory(new DummyService())]);
    store.commit('deleteStep', { index: 2 });
    await flushPromises();
    expect(store.state.dataset).toEqual({
      headers: [{ name: 'x' }, { name: 'y' }],
      data: [[1, 2], [3, 4]],
    });
  });

  it('should call execute pipeline with correct pagesize', async () => {
    const store = setupStore({ pagesize: 1 }, [servicePluginFactory(new DummyService())]);
    store.commit('setCurrentDomain', { currentDomain: 'GoT' });
    await flushPromises();
    expect(store.state.dataset).toEqual({
      headers: [{ name: 'x' }, { name: 'y' }],
      data: [[1, 2]],
    });
  });
});
