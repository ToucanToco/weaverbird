import { expect } from 'chai';
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
  it('emit selectedStep when clicking on a step "time travel" dot', async () => {
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
    await localVue.nextTick();
    expect(wrapper.emitted()).to.eql({ selectedStep: [[]] });
  });

  it('emit selectedStep when clicking on the step itself', async () => {
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
    await localVue.nextTick();
    expect(wrapper.emitted()).to.eql({ selectedStep: [[]] });
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
    expect(modal.exists()).to.be.false;
  });

  it('renders a delete confirmation modal when clicking on the trash icon', async () => {
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
    await localVue.nextTick();
    const modal = wrapper.find('deleteconfirmationmodal-stub');
    expect(modal.exists()).to.be.true;
  });

  it('renders a delete confirmation modal when clicking on the trash icon', async () => {
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
    await localVue.nextTick();
    const modal = wrapper.find('deleteconfirmationmodal-stub');
    expect(modal.exists()).to.be.true;
  });

  it('should not render a trash icon on domain step', () => {
    const wrapper = shallowMount(Step, {
      propsData: {
        key: 0,
        isActive: true,
        isLastActive: true,
        isDisabled: false,
        isFirst: true,
        isLast: true,
        step: { name: 'domain', domain: 'test' },
        indexInPipeline: 0,
      },
    });
    expect(wrapper.find('.fa-trash-alt').exists()).to.be.false;
  });

  describe('Delete confirmation modal', () => {
    it('does not delete a step when clicking on cancel on the delete confirmation modal', async () => {
      const pipeline: Pipeline = [
        { name: 'domain', domain: 'GoT' },
        { name: 'replace', search_column: 'characters', to_replace: [['Snow', 'Targaryen']] },
        { name: 'sort', columns: [{ column: 'death', order: 'asc' }] },
      ];
      const store = setupStore({ pipeline });
      const wrapper = mount(PipelineComponent, { store, localVue });
      const step = wrapper.findAll(Step).at(1);

      // Test for clicking on the top-right cross
      step.find('.fa-trash-alt').trigger('click');
      await localVue.nextTick();
      const modal = step.find(DeleteConfirmationModal);
      modal.find('.fa-times').trigger('click');
      await localVue.nextTick();
      expect(store.state.pipeline.length).to.equal(3);
      expect(step.find(DeleteConfirmationModal).exists()).to.be.false;

      // Test for clicking on the bottom-left cancel button
      step.find('.fa-trash-alt').trigger('click');
      await localVue.nextTick();
      const modalBis = step.find(DeleteConfirmationModal);
      modalBis.find('.vqb-modal__action--secondary').trigger('click');
      await localVue.nextTick();
      expect(store.state.pipeline.length).to.equal(3);
      expect(step.find(DeleteConfirmationModal).exists()).to.be.false;
    });

    it('deletes a step when clicking on validate on the delete confirmation modal', async () => {
      const pipeline: Pipeline = [
        { name: 'domain', domain: 'GoT' },
        { name: 'replace', search_column: 'characters', to_replace: [['Snow', 'Targaryen']] },
        { name: 'sort', columns: [{ column: 'death', order: 'asc' }] },
      ];
      const store = setupStore({ pipeline });
      const wrapper = mount(PipelineComponent, { store, localVue });
      const step = wrapper.findAll(Step).at(1);
      step.find('.fa-trash-alt').trigger('click');
      await localVue.nextTick();
      const modal = step.find(DeleteConfirmationModal);
      modal.find('.vqb-modal__action--primary').trigger('click');
      await localVue.nextTick();
      expect(store.state.pipeline.length).to.equal(2);
      expect(step.find(DeleteConfirmationModal).exists()).to.be.false;
    });
  });

  it('should toggle the edit mode when clicking on the edit icon and emit editStep', () => {
    const pipeline: Pipeline = [
      { name: 'domain', domain: 'GoT' },
      { name: 'replace', search_column: 'characters', to_replace: [['Snow', 'Targaryen']] },
      { name: 'rename', oldname: 'region', newname: 'kingdom' },
      { name: 'sort', columns: [{ column: 'death', order: 'asc' }] },
    ];
    const store = setupStore({ pipeline, isEditingStep: false });
    const wrapper = mount(PipelineComponent, { store, localVue });
    const stepsArray = wrapper.findAll(Step);
    const renameStep = stepsArray.at(2);
    renameStep.find('.fa-cog').trigger('click');
    expect(renameStep.emitted().editStep).to.exist;
    expect(renameStep.emitted().editStep).to.eql([
      [{ name: 'rename', newname: 'kingdom', oldname: 'region' }, 2],
    ]);
  });
});
