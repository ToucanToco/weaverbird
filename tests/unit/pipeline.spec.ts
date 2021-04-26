import { createLocalVue, shallowMount, Wrapper } from '@vue/test-utils';
import Vuex from 'vuex';

import PipelineComponent from '@/components/Pipeline.vue';
import { Pipeline } from '@/lib/steps';

import { buildStateWithOnePipeline, setupMockStore } from './utils';

const localVue = createLocalVue();
localVue.use(Vuex);

describe('Pipeline.vue', () => {
  it('renders steps', () => {
    const pipeline: Pipeline = [
      { name: 'domain', domain: 'GoT' },
      { name: 'replace', search_column: 'characters', to_replace: [['Snow', 'Targaryen']] },
      { name: 'sort', columns: [{ column: 'death', order: 'asc' }] },
    ];
    const store = setupMockStore(buildStateWithOnePipeline(pipeline));
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
      toDelete: false,
      indexInPipeline: 0,
    });
    expect(step2).toEqual({
      step: pipeline[1],
      isActive: true,
      isLastActive: false,
      isDisabled: false,
      isFirst: false,
      isLast: false,
      toDelete: false,
      indexInPipeline: 1,
    });
    expect(step3).toEqual({
      step: pipeline[2],
      isActive: false,
      isLastActive: true,
      isDisabled: false,
      isFirst: false,
      isLast: true,
      toDelete: false,
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

  describe('toggle delete step', () => {
    let wrapper: Wrapper<PipelineComponent>, stepToDelete: Wrapper<any>;
    beforeEach(async () => {
      const pipeline: Pipeline = [
        { name: 'domain', domain: 'GoT' },
        { name: 'rename', toRename: [['foo', 'bar']] },
      ];
      const store = setupMockStore(buildStateWithOnePipeline(pipeline));
      wrapper = shallowMount(PipelineComponent, { store, localVue });
      const steps = wrapper.findAll('step-stub');
      stepToDelete = steps.at(1);
      stepToDelete.vm.$emit('toggleDelete');
      await wrapper.vm.$nextTick();
    });

    //TODO: make better tests when feature updates during PR
    it('should add step to steps to delete', () => {
      expect((wrapper.vm as any).stepsToDelete).toContain(1);
    });
    it('should apply delete class to step', () => {
      expect(stepToDelete.props().toDelete).toBe(true);
    });

    describe('when already selected', () => {
      beforeEach(async () => {
        stepToDelete.vm.$emit('toggleDelete');
        await wrapper.vm.$nextTick();
      });
      it('should remove step from step to delete', () => {
        expect((wrapper.vm as any).stepsToDelete).not.toContain(1);
      });
      it('should remove delete class from step', () => {
        expect(stepToDelete.props().toDelete).toBe(false);
      });
    });
  });
});
