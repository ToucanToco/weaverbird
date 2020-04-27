import { createLocalVue, mount } from '@vue/test-utils';
import flushPromises from 'flush-promises';
import _ from 'lodash';
import Vuex, { Store } from 'vuex';

import PipelineComponent from '@/components/Pipeline.vue';
import { Pipeline } from '@/lib/steps';
import { ScopeContext } from '@/lib/templating';
import { VQB_MODULE_NAME, VQBnamespace } from '@/store';
// eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
import { backendify, BackendService, servicePluginFactory } from '@/store/backend-plugin';

import { buildStateWithOnePipeline, setupMockStore } from './utils';

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
  executePipeline(_store: Store<any>, _pipeline: Pipeline, limit: number, _offset: number) {
    let rset = [
      [1, 2],
      [3, 4],
    ];
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

describe('backendify tests', () => {
  let store: Store<any>;
  let commitSpy: any;

  beforeEach(() => {
    store = setupMockStore();
    commitSpy = jest.spyOn(store, 'commit');
  });

  // NOTE: it.each can't be used to test both error and no-error cases because
  // it messes with typescript's type resolution.
  it('should return the expected valid response', async () => {
    const backendResponse = { data: 'foo' }; // no-error backend response
    const mockOperation = jest.fn((..._args) => Promise.resolve(backendResponse));
    const result = await backendify(mockOperation, store)('foo', 'bar', 'baz');
    expect(result).toEqual(backendResponse);
    expect(mockOperation).toHaveBeenCalledTimes(1);
    expect(mockOperation).toHaveBeenCalledWith('foo', 'bar', 'baz');
    expect(commitSpy).toHaveBeenCalledTimes(2);
    expect(commitSpy).toHaveBeenNthCalledWith(1, VQBnamespace('setLoading'), { isLoading: true });
    expect(commitSpy).toHaveBeenNthCalledWith(2, VQBnamespace('setLoading'), { isLoading: false });
  });

  it('should return the expected no-response', async () => {
    const backendResponse = { error: { message: 'foo', type: 'error' as 'error' } }; // error backend response
    const mockOperation = jest.fn((..._args) => Promise.resolve(backendResponse));
    const result = await backendify(mockOperation, store)('foo', 'bar', 'baz');
    expect(result).toEqual(backendResponse);
    expect(mockOperation).toHaveBeenCalledTimes(1);
    expect(mockOperation).toHaveBeenCalledWith('foo', 'bar', 'baz');
    expect(store.state[VQB_MODULE_NAME].backendErrors).toEqual([{ message: 'foo', type: 'error' }]);
    expect(commitSpy).toHaveBeenCalledTimes(3);
    expect(commitSpy).toHaveBeenNthCalledWith(1, VQBnamespace('setLoading'), { isLoading: true });
    expect(commitSpy).toHaveBeenNthCalledWith(2, VQBnamespace('logBackendError'), {
      backendError: { message: 'foo', type: 'error' },
    });
    expect(commitSpy).toHaveBeenNthCalledWith(3, VQBnamespace('setLoading'), { isLoading: false });
  });

  it('should catch and log the exception', async () => {
    const mockOperation = jest.fn(function(..._args) {
      throw new Error('oopsie');
    });
    const result = await backendify(mockOperation, store)('foo', 'bar', 'baz');
    expect(result).toEqual({ error: { message: 'Error: oopsie', type: 'error' } });
    expect(mockOperation).toHaveBeenCalledTimes(1);
    expect(mockOperation).toHaveBeenCalledWith('foo', 'bar', 'baz');
    expect(store.state[VQB_MODULE_NAME].backendErrors).toEqual([
      { message: 'Error: oopsie', type: 'error' },
    ]);
    expect(commitSpy).toHaveBeenCalledTimes(3);
    expect(commitSpy).toHaveBeenNthCalledWith(1, VQBnamespace('setLoading'), { isLoading: true });
    expect(commitSpy).toHaveBeenNthCalledWith(2, 'vqb/logBackendError', {
      backendError: { message: 'Error: oopsie', type: 'error' },
    });
    expect(commitSpy).toHaveBeenNthCalledWith(3, VQBnamespace('setLoading'), { isLoading: false });
  });
});

describe('backend service plugin tests', () => {
  it('should call execute pipeline when a step is clicked on', async () => {
    const pipeline: Pipeline = [
      { name: 'domain', domain: 'GoT' },
      { name: 'replace', search_column: 'characters', to_replace: [['Snow', 'Targaryen']] },
      { name: 'sort', columns: [{ column: 'death', order: 'asc' }] },
    ];
    const store = setupMockStore(buildStateWithOnePipeline(pipeline), [
      servicePluginFactory(new DummyService()),
    ]);
    const wrapper = mount(PipelineComponent, { store, localVue });
    wrapper.find('.query-pipeline-queue__dot').trigger('click');
    await flushPromises();
    expect(store.state.vqb.dataset).toEqual({
      headers: [{ name: 'x' }, { name: 'y' }],
      data: [
        [1, 2],
        [3, 4],
      ],
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
      buildStateWithOnePipeline(pipeline, {
        selectedStepIndex: 1,
      }),
      [servicePluginFactory(new DummyService())],
    );
    store.commit(VQBnamespace('selectStep'), { index: 2 });
    await flushPromises();
    expect(store.state.vqb.dataset).toEqual({
      headers: [{ name: 'x' }, { name: 'y' }],
      data: [
        [1, 2],
        [3, 4],
      ],
    });
  });

  it('should call execute pipeline when a setCurrentDomain mutation is committed', async () => {
    const store = setupMockStore(buildStateWithOnePipeline([]), [
      servicePluginFactory(new DummyService()),
    ]);
    store.commit(VQBnamespace('setCurrentDomain'), { currentDomain: 'GoT' });
    await flushPromises();
    expect(store.state.vqb.dataset).toEqual({
      headers: [{ name: 'x' }, { name: 'y' }],
      data: [
        [1, 2],
        [3, 4],
      ],
    });
  });

  it('should call execute pipeline when a deleteStep mutation is committed', async () => {
    const pipeline: Pipeline = [
      { name: 'domain', domain: 'GoT' },
      { name: 'replace', search_column: 'characters', to_replace: [['Snow', 'Targaryen']] },
      { name: 'sort', columns: [{ column: 'death', order: 'asc' }] },
    ];
    const store = setupMockStore(buildStateWithOnePipeline(pipeline), [
      servicePluginFactory(new DummyService()),
    ]);
    store.commit(VQBnamespace('deleteStep'), { index: 2 });
    await flushPromises();
    expect(store.state.vqb.dataset).toEqual({
      headers: [{ name: 'x' }, { name: 'y' }],
      data: [
        [1, 2],
        [3, 4],
      ],
    });
  });

  it('should call execute pipeline with correct pagesize', async () => {
    const store = setupMockStore(buildStateWithOnePipeline([], { pagesize: 1 }), [
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
      buildStateWithOnePipeline(pipeline, {
        variables: {
          who: 'john',
          what: 'king',
        },
        interpolateFunc: lodashInterpolate,
      }),
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
      buildStateWithOnePipeline(pipeline, {
        variables: {},
        interpolateFunc: lodashInterpolate,
      }),
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

  it('should call execute pipeline after dereferencing pipelines', async () => {
    const service = new DummyService();
    const executeSpy = jest.spyOn(service, 'executePipeline');
    const pipeline: Pipeline = [
      { name: 'domain', domain: 'GoT' },
      { name: 'append', pipelines: ['dataset1', 'dataset2'] },
      {
        name: 'join',
        right_pipeline: 'dataset3',
        type: 'left',
        on: [['toto', 'tata']],
      },
    ];
    const store = setupMockStore(
      {
        currentPipelineName: 'default_pipeline',
        pipelines: {
          default_pipeline: pipeline,
          dataset1: [{ name: 'domain', domain: 'domain1' }],
          dataset2: [{ name: 'domain', domain: 'domain2' }],
          dataset3: [{ name: 'domain', domain: 'domain3' }],
        },
      },
      [servicePluginFactory(service)],
    );
    store.commit(VQBnamespace('setCurrentDomain'), { currentDomain: 'GoT' });
    await flushPromises();
    expect(executeSpy).toHaveBeenCalledTimes(1);
    expect(executeSpy.mock.calls[0][1]).toEqual([
      { domain: 'GoT', name: 'domain' },
      {
        name: 'append',
        pipelines: [
          [{ name: 'domain', domain: 'domain1' }],
          [{ name: 'domain', domain: 'domain2' }],
        ],
      },
      {
        name: 'join',
        right_pipeline: [{ name: 'domain', domain: 'domain3' }],
        type: 'left',
        on: [['toto', 'tata']],
      },
    ]);
  });

  it('should call execute pipeline after dereferencing imbricated pipelines', async () => {
    const service = new DummyService();
    const executeSpy = jest.spyOn(service, 'executePipeline');
    const pipeline: Pipeline = [
      { name: 'domain', domain: 'GoT' },
      { name: 'append', pipelines: ['dataset1'] },
    ];
    const store = setupMockStore(
      {
        currentPipelineName: 'default_pipeline',
        pipelines: {
          default_pipeline: pipeline,
          dataset1: [
            { name: 'domain', domain: 'domain1' },
            { name: 'append', pipelines: ['dataset2'] },
          ],
          dataset2: [
            { name: 'domain', domain: 'domain2' },
            {
              name: 'join',
              right_pipeline: 'dataset3',
              type: 'left',
              on: [['toto', 'tata']],
            },
          ],
          dataset3: [{ name: 'domain', domain: 'domain3' }],
        },
      },
      [servicePluginFactory(service)],
    );
    store.commit(VQBnamespace('setCurrentDomain'), { currentDomain: 'GoT' });
    await flushPromises();
    expect(executeSpy).toHaveBeenCalledTimes(1);
    expect(executeSpy.mock.calls[0][1]).toEqual([
      { domain: 'GoT', name: 'domain' },
      {
        name: 'append',
        pipelines: [
          [
            { name: 'domain', domain: 'domain1' },
            {
              name: 'append',
              pipelines: [
                [
                  { name: 'domain', domain: 'domain2' },
                  {
                    name: 'join',
                    right_pipeline: [{ name: 'domain', domain: 'domain3' }],
                    type: 'left',
                    on: [['toto', 'tata']],
                  },
                ],
              ],
            },
          ],
        ],
      },
    ]);
  });
});
