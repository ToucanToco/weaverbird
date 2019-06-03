import { mount, createLocalVue, shallowMount } from '@vue/test-utils';
import Vuex from 'vuex';
import { Pipeline } from '@/lib/steps';
import { setupStore } from '@/store';
import DeleteConfirmationModal from '@/components/DeleteConfirmationModal.vue';
import PipelineComponent from '@/components/Pipeline.vue';
import Step from '@/components/Step.vue';

const localVue = createLocalVue();
localVue.use(Vuex);

describe('Step.vue', () => {
  it('emit selectedStep when clicking on a step "time travel" dot', () => {
    const wrapper = shallowMount(Step, {
      propsData: {
        key: 0,
        isActive: true,
        isDisabled: false,
        isFirst: false,
        isLast: true,
        step: { name: 'rename', oldname: 'foo', newname: 'bar' },
        indexInPipeline: 2,
      },
    });
    wrapper.find('.query-pipeline-queue__dot').trigger('click');
    expect(wrapper.emitted()).toEqual({ selectedStep: [[]] });
  });

  it('emit selectedStep when clicking on the step itself', () => {
    const wrapper = shallowMount(Step, {
      propsData: {
        key: 0,
        isActive: true,
        isDisabled: false,
        isFirst: false,
        isLast: true,
        step: { name: 'rename', oldname: 'foo', newname: 'bar' },
        indexInPipeline: 2,
      },
    });
    wrapper.find('.query-pipeline-step').trigger('click');
    expect(wrapper.emitted()).toEqual({ selectedStep: [[]] });
  });

  it('does not render a delete confirmation modal by default', () => {
    const wrapper = shallowMount(Step, {
      propsData: {
        key: 0,
        isActive: true,
        isDisabled: false,
        isFirst: false,
        isLast: true,
        step: { name: 'rename', oldname: 'foo', newname: 'bar' },
        indexInPipeline: 2,
      },
    });
    const modal = wrapper.find('deleteconfirmationmodal-stub');
    expect(modal.exists()).toBeFalsy();
  });

  it('renders a delete confirmation modal when clicking on the trash icon', () => {
    const wrapper = shallowMount(Step, {
      propsData: {
        key: 0,
        isActive: true,
        isDisabled: false,
        isFirst: false,
        isLast: true,
        step: { name: 'rename', oldname: 'foo', newname: 'bar' },
        indexInPipeline: 2,
      },
    });
    wrapper.find('.fa-trash-alt').trigger('click');
    const modal = wrapper.find('deleteconfirmationmodal-stub');
    expect(modal.exists()).toBeTruthy();
  });

  it('renders a delete confirmation modal when clicking on the trash icon', () => {
    const wrapper = shallowMount(Step, {
      propsData: {
        key: 0,
        isActive: true,
        isDisabled: false,
        isFirst: false,
        isLast: true,
        step: { name: 'rename', oldname: 'foo', newname: 'bar' },
        indexInPipeline: 2,
      },
    });
    wrapper.find('.fa-trash-alt').trigger('click');
    const modal = wrapper.find('deleteconfirmationmodal-stub');
    expect(modal.exists()).toBeTruthy();
  });

  describe('Delete confirmation modal', () => {
    it('does not delete a step when clicking on cancel on the delete confirmation modal', () => {
      const pipeline: Pipeline = [
        { name: 'replace', search_column: 'characters', to_replace: [['Snow', 'Targaryen']] },
        { name: 'sort', columns: ['death'] },
      ];
      const store = setupStore({ pipeline });
      const wrapper = mount(PipelineComponent, { store, localVue });
      const step = wrapper.find(Step);

      // Test for clicking on the top-right cross
      step.find('.fa-trash-alt').trigger('click');
      const modal = step.find(DeleteConfirmationModal);
      modal.find('.fa-times').trigger('click');
      expect(store.state.pipeline.length).toEqual(2);
      expect(step.find(DeleteConfirmationModal).exists()).toBeFalsy();

      // Test for clicking on the bottom-left cancel button
      step.find('.fa-trash-alt').trigger('click');
      const modalBis = step.find(DeleteConfirmationModal);
      modalBis.find('.vqb-modal__action--secondary').trigger('click');
      expect(store.state.pipeline.length).toEqual(2);
      expect(step.find(DeleteConfirmationModal).exists()).toBeFalsy();
    });

    it('deletes a step when clicking on validate on the delete confirmation modal', () => {
      const pipeline: Pipeline = [
        { name: 'replace', search_column: 'characters', to_replace: [['Snow', 'Targaryen']] },
        { name: 'sort', columns: ['death'] },
      ];
      const store = setupStore({ pipeline });
      const wrapper = mount(PipelineComponent, { store, localVue });
      const step = wrapper.find(Step);
      step.find('.fa-trash-alt').trigger('click');
      const modal = step.find(DeleteConfirmationModal);
      modal.find('.vqb-modal__action--primary').trigger('click');
      expect(store.state.pipeline.length).toEqual(1);
      expect(step.find(DeleteConfirmationModal).exists()).toBeFalsy();
    });
  });
});
