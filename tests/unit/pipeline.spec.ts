import { shallowMount, createLocalVue } from '@vue/test-utils';
import Vuex from 'vuex';
import { Pipeline } from '@/lib/steps';
import { setupStore } from '@/store';
import PipelineComponent from '@/components/Pipeline.vue';

const localVue = createLocalVue();
localVue.use(Vuex);

describe('Pipeline.vue', () => {
  it('renders steps', () => {
    const pipeline: Pipeline = [
      { name: 'domain', domain: 'GoT' },
      { name: 'replace', search_column: 'characters', to_replace: [['Snow', 'Targaryen']] },
      { name: 'sort', columns: [{ column: 'death', order: 'asc' }] },
    ];
    const store = setupStore({ pipeline });
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

  describe('when only domain step', () => {
    it('should render a container with message', () => {
      const pipeline: Pipeline = [{ name: 'domain', domain: 'GoT' }];
      const store = setupStore({ pipeline });
      const wrapper = shallowMount(PipelineComponent, { store, localVue });
      expect(wrapper.find('.query-pipeline__empty-message').text()).toEqual(
        'Start playing with data directly from the right table',
      );
      expect(wrapper.find('.fa-magic').exists()).toBeTruthy();
    });
  });
});
