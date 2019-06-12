import { expect } from 'chai';
import { shallowMount, createLocalVue } from '@vue/test-utils';
import Vue from 'vue';
import Vuex from 'vuex';
import { setupStore } from '@/store';
import Vqb from '../../src/components/Vqb.vue';

const localVue = createLocalVue();
localVue.use(Vuex);

describe('Vqb', () => {
  it('should instantiate', () => {
    const wrapper = shallowMount(Vqb, { store: setupStore(), localVue });
    expect(wrapper.exists()).to.be.true;
    expect(wrapper.vm.$store.state.isEditingStep).to.be.false;
  });

  it('should instantiate a FormRenameStep component', () => {
    const store = setupStore({ isEditingStep: true });
    const wrapper = shallowMount(Vqb, {
      store,
      localVue,
      data: () => {
        return { formToInstantiate: 'rename-step-form' };
      },
    });
    const form = wrapper.find('rename-step-form-stub');
    expect(form.exists()).to.be.true;
  });

  it('should instantiate a DeleteColumnStep component', () => {
    const store = setupStore({ isEditingStep: true });
    const wrapper = shallowMount(Vqb, {
      store,
      localVue,
      data: () => {
        return { formToInstantiate: 'delete-step-form' };
      },
    });
    const form = wrapper.find('delete-step-form-stub');
    expect(form.exists()).to.be.true;
  });

  it('should instantiate a FillnaStep component', () => {
    const store = setupStore({ isEditingStep: true });
    const wrapper = shallowMount(Vqb, {
      store,
      localVue,
      data: () => {
        return { formToInstantiate: 'fillna-step-form' };
      },
    });
    const form = wrapper.find('fillna-step-form-stub');
    expect(form.exists()).to.be.true;
  });

  it('should set editingMode on when step is created', async () => {
    const store = setupStore();
    const wrapper = shallowMount(Vqb, { store, localVue });
    expect(store.state.isEditingStep).to.be.false;
    wrapper
      .find('dataviewer-stub')
      .vm.$emit('stepCreated', { name: 'rename', oldname: 'foo', newname: 'bar' });
    await wrapper.vm.$nextTick();
    expect(store.state.isEditingStep).to.be.true;
  });

  it('should set pipeline when form is saved', async () => {
    const store = setupStore({
      isEditingStep: true,
    });
    const wrapper = shallowMount(Vqb, {
      store,
      localVue,
      data: () => {
        return { formToInstantiate: 'rename-step-form' };
      },
    });
    await Vue.nextTick();
    wrapper
      .find('rename-step-form-stub')
      .vm.$emit('formSaved', { name: 'rename', oldname: 'columnA', newname: 'columnAA' });
    expect(store.state.isEditingStep).to.be.false;
    expect(store.state.pipeline).to.eql([
      { name: 'rename', oldname: 'columnA', newname: 'columnAA' },
    ]);
  });

  it('should cancel edition', async () => {
    const store = setupStore({
      pipeline: [{ name: 'domain', domain: 'foo' }],
      isEditingStep: true,
    });
    const wrapper = shallowMount(Vqb, {
      store,
      localVue,
      data: () => {
        return { formToInstantiate: 'rename-step-form' };
      },
    });
    await Vue.nextTick();
    wrapper.find('rename-step-form-stub').vm.$emit('cancel');
    expect(store.state.isEditingStep).to.be.false;
    expect(store.state.pipeline).to.eql([{ name: 'domain', domain: 'foo' }]);
  });
});
