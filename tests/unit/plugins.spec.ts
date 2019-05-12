import { createLocalVue, mount } from '@vue/test-utils';
import Vuex from 'vuex';
import flushPromises from 'flush-promises';

import { Pipeline } from '@/lib/steps';
import { MongoResults, mongoResultsToDataset } from '@/lib/dataset/mongo';
import { setupStore } from '@/store';
import { VQBState } from '@/store/state';
import { BackendService, servicePluginFactory } from '@/store/backend-plugin';
import PipelineComponent from '@/components/Pipeline.vue';

const localVue = createLocalVue();
localVue.use(Vuex);

class DummyService implements BackendService<MongoResults> {
  listCollections() {
    return Promise.resolve(['foo', 'bar']);
  }

  executePipeline(pipeline: Pipeline) {
    return Promise.resolve([{ x: 1, y: 2 }, { x: 3, y: 4 }]);
  }

  formatDataset(results: MongoResults) {
    return mongoResultsToDataset(results);
  }
}

describe('backend service plugin tests', () => {
  it('should call execute pipeline when a step is clicked on', async () => {
    const pipeline: Pipeline = [
      { name: 'domain', domain: 'GoT' },
      { name: 'replace', search_column: 'characters', to_replace: [['Snow', 'Targaryen']] },
      { name: 'sort', columns: ['death'] },
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

  it('should call execute pipeline when pipeline is set', async () => {
    const store = setupStore({}, [servicePluginFactory(new DummyService())]);
    store.commit('selectStep', { index: 2 });
    await flushPromises();
    expect(store.state.dataset).toEqual({
      headers: [{ name: 'x' }, { name: 'y' }],
      data: [[1, 2], [3, 4]],
    });
  });

  it('should call execute pipeline when pipeline is set', async () => {
    const store = setupStore({}, [servicePluginFactory(new DummyService())]);
    const pipeline: Pipeline = [
      { name: 'domain', domain: 'GoT' },
      { name: 'replace', search_column: 'characters', to_replace: [['Snow', 'Targaryen']] },
      { name: 'sort', columns: ['death'] },
    ];
    store.commit('setPipeline', { pipeline });
    await flushPromises();
    expect(store.state.dataset).toEqual({
      headers: [{ name: 'x' }, { name: 'y' }],
      data: [[1, 2], [3, 4]],
    });
  });
});
