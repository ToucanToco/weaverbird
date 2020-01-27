import { createLocalVue,shallowMount } from '@vue/test-utils';
import Vuex from 'vuex';

import PipelineComponent from '@/components/Pipeline.vue';
import { Pipeline } from '@/lib/steps';

import { setupMockStore } from './utils';

const localVue = createLocalVue();
localVue.use(Vuex);

describe('Pipeline.vue', () => {
  it('renders steps', () => {
    const pipeline: Pipeline = [
      { name: 'domain', domain: 'GoT' },
      { name: 'replace', search_column: 'characters', to_replace: [['Snow', 'Targaryen']] },
      { name: 'sort', columns: [{ column: 'death', order: 'asc' }] },
    ];
    const store = setupMockStore({ pipeline });
    const wrapper = shallowMount(PipelineComponent, { store, localVue });
    const steps = wrapper.findAll('step-stub');
    expect(steps.length).toEqual(3);
    const [step1, step2, step3] = steps.wrappers.map(stub => stub.props());
    expect(step1).toEqual({
      step: pipeline[0],
      isActive: true,
      isLastActive: false,
      isDisabled: false,
      isFirst: true,
      isLast: false,
      indexInPipeline: 0,
    });
    expect(step2).toEqual({
      step: pipeline[1],
      isActive: true,
      isLastActive: false,
      isDisabled: false,
      isFirst: false,
      isLast: false,
      indexInPipeline: 1,
    });
    expect(step3).toEqual({
      step: pipeline[2],
      isActive: false,
      isLastActive: true,
      isDisabled: false,
      isFirst: false,
      isLast: true,
      indexInPipeline: 2,
    });
  });

  it('should render a container with tips', () => {
    const pipeline: Pipeline = [{ name: 'domain', domain: 'GoT' }];
    const store = setupMockStore({ pipeline });
    const wrapper = shallowMount(PipelineComponent, { store, localVue });
    expect(wrapper.find('.query-pipeline__tips').text()).toEqual(
      'Interact with the widgets and table on the right to add steps',
    );
    expect(wrapper.find('.fa-magic').exists()).toBeTruthy();
  });
});
