import { createLocalVue, shallowMount } from '@vue/test-utils';
import Vuex from 'vuex';

import PipelineSelector from '@/components/PipelineSelector.vue';

import { setupMockStore } from './utils';

const localVue = createLocalVue();
localVue.use(Vuex);

describe('PipelineSelector', () => {
  it('should instantiate', () => {
    const wrapper = shallowMount(PipelineSelector, { store: setupMockStore(), localVue });
    expect(wrapper.exists()).toBeTruthy();
  });

  it('should display all pipeline names in a select', () => {
    const store = setupMockStore({
      pipelines: {
        pipeline1: [],
        pipeline2: [],
        pipeline3: [],
      },
    });
    const wrapper = shallowMount(PipelineSelector, {
      store,
      localVue,
    });
    const select = wrapper.find('select');
    expect(select.exists()).toBeTruthy();
    const options = select.findAll('option');
    expect(options).toHaveLength(3);
    const optionsValues = options.wrappers.map(o => o.text());
    expect(optionsValues).toEqual(['pipeline1', 'pipeline2', 'pipeline3']);
  });

  it('should display the selected pipeline if any', () => {
    const store = setupMockStore({
      currentPipelineName: 'pipeline2',
      pipelines: {
        pipeline1: [],
        pipeline2: [],
        pipeline3: [],
      },
    });
    const wrapper = shallowMount(PipelineSelector, {
      store,
      localVue,
    });
    const select = wrapper.find('select');
    expect((select.findAll('option').at(1).element as HTMLOptionElement).selected).toBeTruthy();
  });

  it('should update the currentPipelineName when a pipeline is selected', () => {
    const store = setupMockStore({
      currentPipelineName: 'pipeline2',
      pipelines: {
        pipeline1: [],
        pipeline2: [],
        pipeline3: [],
      },
    });
    const wrapper = shallowMount(PipelineSelector, {
      store,
      localVue,
    });
    const select = wrapper.find('select');
    select
      .findAll('option')
      .at(2)
      .setSelected();
    select.trigger('input');
    expect(store.state.vqb.currentPipelineName).toEqual('pipeline3');
    expect((select.findAll('option').at(2).element as HTMLOptionElement).selected).toBeTruthy();
  });
});
