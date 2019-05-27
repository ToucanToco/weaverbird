import { shallowMount, createLocalVue } from '@vue/test-utils';
import Vuex from 'vuex';
import { setupStore } from '@/store';
import DataViewer from '@/components/DataViewer.vue';
import FormRenameStep from '@/components/FormRenameStep.vue';
import Vqb from '../../src/components/Vqb.vue';

const localVue = createLocalVue();
localVue.use(Vuex);

describe('Vqb', () => {
  it('should instantiate', () => {
    const wrapper = shallowMount(Vqb, { store: setupStore(), localVue });
    expect(wrapper.exists()).toBeTruthy();
    expect(wrapper.vm.$data.isEditingStep).toBeFalsy();
  });

  it('should set editingMode on when step is created', () => {
    const store = setupStore();
    const wrapper = shallowMount(Vqb, { store, localVue });
    expect(wrapper.vm.$data.isEditingStep).toBeFalsy();
    wrapper.find(DataViewer).vm.$emit('stepCreated');
    expect(wrapper.vm.$data.isEditingStep).toBeTruthy();
  });

  it('should set pipeline when form is saved', () => {
    const store = setupStore();
    const wrapper = shallowMount(Vqb, { store, localVue });
    wrapper.setData({ isEditingStep: true });
    wrapper
      .find(FormRenameStep)
      .vm.$emit('formSaved', { name: 'rename', oldname: 'columnA', newname: 'columnAA' });
    expect(wrapper.vm.$data.isEditingStep).toBeFalsy();
    expect(store.state.pipeline).toEqual([
      { name: 'rename', oldname: 'columnA', newname: 'columnAA' },
    ]);
  });

  it('should cancel edition', () => {
    const store = setupStore({ pipeline: [{ name: 'domain', domain: 'foo' }] });
    const wrapper = shallowMount(Vqb, { store, localVue });
    wrapper.setData({ isEditingStep: true });
    wrapper.find(FormRenameStep).vm.$emit('cancel');
    expect(wrapper.vm.$data.isEditingStep).toBeFalsy();
    expect(store.state.pipeline).toEqual([{ name: 'domain', domain: 'foo' }]);
  });
});
