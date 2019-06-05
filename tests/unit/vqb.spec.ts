import { expect } from 'chai';
import { shallowMount, createLocalVue } from '@vue/test-utils';
import Vue from 'vue';
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
    expect(wrapper.exists()).to.be.true;
    expect(wrapper.vm.$data.isEditingStep).to.be.false;
  });

  it('should set editingMode on when step is created', () => {
    const store = setupStore();
    const wrapper = shallowMount(Vqb, { store, localVue });
    expect(wrapper.vm.$data.isEditingStep).to.be.false;
    wrapper.find(DataViewer).vm.$emit('stepCreated');
    expect(wrapper.vm.$data.isEditingStep).to.be.true;
  });

  it('should set pipeline when form is saved', async () => {
    const store = setupStore();
    const wrapper = shallowMount(Vqb, { store, localVue });
    wrapper.setData({ isEditingStep: true });
    await Vue.nextTick();
    wrapper
      .find(FormRenameStep)
      .vm.$emit('formSaved', { name: 'rename', oldname: 'columnA', newname: 'columnAA' });
    expect(wrapper.vm.$data.isEditingStep).to.be.false;
    expect(store.state.pipeline).to.eql([
      { name: 'rename', oldname: 'columnA', newname: 'columnAA' },
    ]);
  });

  it('should cancel edition', async () => {
    const store = setupStore({ pipeline: [{ name: 'domain', domain: 'foo' }] });
    const wrapper = shallowMount(Vqb, { store, localVue });
    wrapper.setData({ isEditingStep: true });
    await Vue.nextTick();
    wrapper.find(FormRenameStep).vm.$emit('cancel');
    expect(wrapper.vm.$data.isEditingStep).to.be.false;
    expect(store.state.pipeline).to.eql([{ name: 'domain', domain: 'foo' }]);
  });
});
