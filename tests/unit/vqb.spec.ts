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
    const store = setupStore();
    const wrapper = shallowMount(Vqb, { store, localVue });
    expect(wrapper.exists()).toBeTruthy();
    expect(store.state.isEditingStep).toBeFalsy();
  });

  it('should set editingMode on when step is created', () => {
    const store = setupStore();
    const wrapper = shallowMount(Vqb, { store, localVue });
    expect(store.state.isEditingStep).toBeFalsy();
    wrapper.find(DataViewer).vm.$emit('stepCreated');
    expect(store.state.isEditingStep).toBeTruthy();
  });

  it('should set pipeline when form is saved', () => {
    const store = setupStore({
      pipeline: [{ name: 'domain', domain: 'foo' }],
      isEditingStep: true,
    });
    const wrapper = shallowMount(Vqb, { store, localVue });
    wrapper
      .find(FormRenameStep)
      .vm.$emit('formSaved', { name: 'rename', oldname: 'columnA', newname: 'columnAA' });
    expect(store.state.isEditingStep).toBeFalsy();
    expect(store.state.pipeline).toEqual([
      { name: 'domain', domain: 'foo' },
      { name: 'rename', oldname: 'columnA', newname: 'columnAA' },
    ]);
  });

  it('should cancel edition', () => {
    const store = setupStore({
      pipeline: [{ name: 'domain', domain: 'foo' }],
      isEditingStep: true,
    });
    const wrapper = shallowMount(Vqb, { store, localVue });
    wrapper.find(FormRenameStep).vm.$emit('cancel');
    expect(store.state.isEditingStep).toBeFalsy();
    expect(store.state.pipeline).toEqual([{ name: 'domain', domain: 'foo' }]);
  });
});
