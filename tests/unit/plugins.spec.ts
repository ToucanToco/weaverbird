import _ from 'lodash';
import { createLocalVue, mount } from '@vue/test-utils';
import Vuex, { Store } from 'vuex';
import flushPromises from 'flush-promises';

import { Pipeline } from '@/lib/steps';
import { ScopeContext } from '@/lib/templating';
import { VQBnamespace } from '@/store';
import { setupMockStore } from './utils';
// eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
import { BackendService, servicePluginFactory } from '@/store/backend-plugin';
import PipelineComponent from '@/components/Pipeline.vue';

const localVue = createLocalVue();
localVue.use(Vuex);

function lodashInterpolate(value: string, context: ScopeContext) {
  const compiled = _.template(value);
  return compiled(context);
}

class DummyService implements BackendService {
  listCollections(_store: Store<any>) {
    return Promise.resolve({ data: ['foo', 'bar'] });
  }

  // eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
  executePipeline(_store: Store<any>, pipeline: Pipeline, limit: number, _offset: number) {
    let rset = [[1, 2], [3, 4]];
    if (limit) {
      rset = rset.slice(0, limit);
    }
    return Promise.resolve({
      data: {
        headers: [{ name: 'x' }, { name: 'y' }],
        data: rset,
      },
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
    const store = setupMockStore({ pipeline }, [
      servicePluginFactory(new DummyService()),
    ]);
    const wrapper = mount(PipelineComponent, { store, localVue });
    wrapper.find('.query-pipeline-queue__dot').trigger('click');
    await flushPromises();
    expect(store.state.vqb.dataset).toEqual({
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
    const store = setupMockStore(
      {
        pipeline,
        selectedStepIndex: 1,
      },
      [servicePluginFactory(new DummyService())],
    );
    store.commit(VQBnamespace('selectStep'), { index: 2 });
    await flushPromises();
    expect(store.state.vqb.dataset).toEqual({
      headers: [{ name: 'x' }, { name: 'y' }],
      data: [[1, 2], [3, 4]],
    });
  });

  it('should call execute pipeline when a setCurrentDomain mutation is committed', async () => {
    const store = setupMockStore({}, [servicePluginFactory(new DummyService())]);
    store.commit(VQBnamespace('setCurrentDomain'), { currentDomain: 'GoT' });
    await flushPromises();
    expect(store.state.vqb.dataset).toEqual({
      headers: [{ name: 'x' }, { name: 'y' }],
      data: [[1, 2], [3, 4]],
    });
  });

  it('should call execute pipeline when a deleteStep mutation is committed', async () => {
    const pipeline: Pipeline = [
      { name: 'domain', domain: 'GoT' },
      { name: 'replace', search_column: 'characters', to_replace: [['Snow', 'Targaryen']] },
      { name: 'sort', columns: [{ column: 'death', order: 'asc' }] },
    ];
    const store = setupMockStore({ pipeline }, [
      servicePluginFactory(new DummyService()),
    ]);
    store.commit(VQBnamespace('deleteStep'), { index: 2 });
    await flushPromises();
    expect(store.state.vqb.dataset).toEqual({
      headers: [{ name: 'x' }, { name: 'y' }],
      data: [[1, 2], [3, 4]],
    });
  });

  it('should call execute pipeline with correct pagesize', async () => {
    const store = setupMockStore({ pagesize: 1 }, [
      servicePluginFactory(new DummyService()),
    ]);
    store.commit(VQBnamespace('setCurrentDomain'), { currentDomain: 'GoT' });
    await flushPromises();
    expect(store.state.vqb.dataset).toEqual({
      headers: [{ name: 'x' }, { name: 'y' }],
      data: [[1, 2]],
    });
  });

  it('should call execute pipeline with interpolated pipeline', async () => {
    const service = new DummyService();
    const executeSpy = jest.spyOn(service, 'executePipeline');
    const pipeline: Pipeline = [
      { name: 'domain', domain: 'GoT' },
      {
        name: 'replace',
        search_column: 'characters',
        to_replace: [['<%= who %>', '<%= what %>']],
      },
    ];
    const store = setupMockStore(
      {
        pipeline,
        variables: {
          who: 'john',
          what: 'king',
        },
        interpolateFunc: lodashInterpolate,
      },
      [servicePluginFactory(service)],
    );
    store.commit(VQBnamespace('setCurrentDomain'), { currentDomain: 'GoT' });
    await flushPromises();
    expect(executeSpy).toHaveBeenCalledTimes(1);
    expect(executeSpy.mock.calls[0][1]).toEqual([
      { domain: 'GoT', name: 'domain' },
      {
        name: 'replace',
        search_column: 'characters',
        to_replace: [['john', 'king']],
      },
    ]);
  });

  it('should call execute pipeline with uninterpolated pipeline if no variables', async () => {
    const service = new DummyService();
    const executeSpy = jest.spyOn(service, 'executePipeline');
    const pipeline: Pipeline = [
      { name: 'domain', domain: 'GoT' },
      {
        name: 'replace',
        search_column: 'characters',
        to_replace: [['<%= who %>', '<%= what %>']],
      },
    ];
    const store = setupMockStore(
      {
        pipeline,
        variables: {},
        interpolateFunc: lodashInterpolate,
      },
      [servicePluginFactory(service)],
    );
    store.commit(VQBnamespace('setCurrentDomain'), { currentDomain: 'GoT' });
    await flushPromises();
    expect(executeSpy).toHaveBeenCalledTimes(1);
    expect(executeSpy.mock.calls[0][1]).toEqual([
      { domain: 'GoT', name: 'domain' },
      {
        name: 'replace',
        search_column: 'characters',
        to_replace: [['<%= who %>', '<%= what %>']],
      },
    ]);
  });
});
