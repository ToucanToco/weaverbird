import { createLocalVue, mount, shallowMount, Wrapper } from '@vue/test-utils';
import Vuex from 'vuex';

import DeleteConfirmationModal from '@/components/DeleteConfirmationModal.vue';
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
        { name: 'sort', columns: [{ column: 'death', order: 'asc' }] },
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

    describe('when there is steps selected', () => {
      beforeEach(async () => {
        wrapper.setData({ stepsToDelete: [1, 2] });
        await wrapper.vm.$nextTick();
      });
      it('should show the delete steps button', () => {
        expect(wrapper.find('.query-pipeline__delete-steps').exists()).toBe(true);
      });
      it('should display the number of selected steps into the delete steps button', () => {
        expect(wrapper.find('.query-pipeline__delete-steps').text()).toStrictEqual(
          'Delete [2] selected',
        );
      });
    });

    describe('when there is no steps to delete', () => {
      beforeEach(async () => {
        wrapper.setData({ stepsToDelete: [] });
        await wrapper.vm.$nextTick();
      });
      it('should hide the delete steps button', () => {
        expect(wrapper.find('.query-pipeline__delete-steps').exists()).toBe(false);
      });
    });
  });

  it('does not render a delete confirmation modal by default', () => {
    const pipeline: Pipeline = [
      { name: 'domain', domain: 'GoT' },
      { name: 'rename', toRename: [['foo', 'bar']] },
    ];
    const store = setupMockStore(buildStateWithOnePipeline(pipeline));
    const wrapper = shallowMount(PipelineComponent, { store, localVue });
    const modal = wrapper.find('deleteconfirmationmodal-stub');
    expect(modal.exists()).toBe(false);
  });

  describe('clicking on the delete button', () => {
    let wrapper: Wrapper<PipelineComponent>, modal: Wrapper<any>;
    const stepsToDelete = [1];

    beforeEach(async () => {
      const pipeline: Pipeline = [
        { name: 'domain', domain: 'GoT' },
        { name: 'rename', toRename: [['foo', 'bar']] },
      ];
      const store = setupMockStore(buildStateWithOnePipeline(pipeline));
      wrapper = mount(PipelineComponent, { store, localVue });
      wrapper.setData({ stepsToDelete });
      //TODO: update this line when delete button is enabled
      (wrapper.vm as any).openDeleteConfirmationModal();
      await wrapper.vm.$nextTick();
      modal = wrapper.find(DeleteConfirmationModal);
    });

    it('should render a delete confirmation modal', async () => {
      expect(modal.exists()).toBe(true);
    });

    describe('when cancel confirmation', () => {
      //TODO: update this tests when delete logic is enabled
      beforeEach(async () => {
        modal.find('.vqb-modal__action--secondary').trigger('click');
        await wrapper.vm.$nextTick();
        modal = wrapper.find(DeleteConfirmationModal);
      });
      it('should close the confirmation modal', () => {
        // close the modal
        expect(modal.exists()).toBe(false);
      });
      it('should keep the selected steps unchanged', () => {
        expect((wrapper.vm as any).stepsToDelete).toStrictEqual(stepsToDelete);
      });
    });

    describe('when validate', () => {
      //TODO: update this tests when delete logic is enabled
      beforeEach(async () => {
        modal.find('.vqb-modal__action--primary').trigger('click');
        await wrapper.vm.$nextTick();
        modal = wrapper.find(DeleteConfirmationModal);
      });
      it('should close the confirmation modal', () => {
        // close the modal
        expect(modal.exists()).toBe(false);
      });
      it('should clean the selected steps', () => {
        expect((wrapper.vm as any).stepsToDelete).toStrictEqual([]);
      });
    });
  });
});
