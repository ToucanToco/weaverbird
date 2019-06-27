import { expect } from 'chai';
import { shallowMount, createLocalVue, Wrapper } from '@vue/test-utils';
import Vue from 'vue';
import Vuex, { Store } from 'vuex';
import { setupStore } from '@/store';
import Vqb from '../../src/components/Vqb.vue';
import { VQBState } from '@/store/state';

const localVue = createLocalVue();
localVue.use(Vuex);

describe('Vqb', () => {
  it('should instantiate', () => {
    const wrapper = shallowMount(Vqb, { store: setupStore(), localVue });
    expect(wrapper.exists()).to.be.true;
    expect(wrapper.vm.$store.state.isEditingStep).to.be.false;
  });

  it('should instantiate a AggregateStepForm component', () => {
    const store = setupStore({ isEditingStep: true });
    const wrapper = shallowMount(Vqb, {
      store,
      localVue,
      data: () => {
        return { formToInstantiate: 'aggregate-step-form' };
      },
    });
    const form = wrapper.find('aggregate-step-form-stub');
    expect(form.exists()).to.be.true;
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

  it('should instantiate a DomainStep component', () => {
    const store = setupStore({ isEditingStep: true });
    const wrapper = shallowMount(Vqb, {
      store,
      localVue,
      data: () => {
        return { formToInstantiate: 'domain-step-form' };
      },
    });
    const form = wrapper.find('domain-step-form-stub');
    expect(form.exists()).to.be.true;
  });

  it('should set editingMode on when step is created', async () => {
    const store = setupStore();
    const wrapper = shallowMount(Vqb, { store, localVue });
    expect(store.state.isEditingStep).to.be.false;
    wrapper.find('dataviewer-stub').vm.$emit('stepCreated', 'rename');
    await wrapper.vm.$nextTick();
    expect(store.state.isEditingStep).to.be.true;
  });

  describe('save step', () => {
    let store: Store<VQBState>;
    let wrapper: Wrapper<Vue>;

    context('when editing domain step', () => {
      beforeEach(async () => {
        store = setupStore({
          pipeline: [{ name: 'domain', domain: 'foo' }],
          isEditingStep: true,
        });
        wrapper = shallowMount(Vqb, {
          store,
          localVue,
          stubs: {
            transition: false,
          },
          data: () => {
            return { formToInstantiate: 'domain-step-form' };
          },
        });
        await localVue.nextTick();
      });

      it('should update the pipeline', async () => {
        wrapper.find('domain-step-form-stub').vm.$emit('formSaved', {
          name: 'domain',
          domain: 'bar',
        });
        expect(store.state.isEditingStep).to.be.false;
        expect(store.state.pipeline).to.eql([{ name: 'domain', domain: 'bar' }]);
      });

      it('should compute the right currentDomain', async () => {
        wrapper.find('domain-step-form-stub').vm.$emit('formSaved', {
          name: 'domain',
          domain: 'bar',
        });
        expect(store.state.currentDomain).to.eql('bar');
      });
    });

    context('when saving other steps', () => {
      beforeEach(async () => {
        store = setupStore({
          pipeline: [{ name: 'domain', domain: 'foo' }],
          isEditingStep: true,
        });
        wrapper = shallowMount(Vqb, {
          store,
          localVue,
          stubs: {
            transition: false,
          },
          data: () => {
            return { formToInstantiate: 'rename-step-form' };
          },
        });
        await localVue.nextTick();
      });

      it('should set pipeline when form is saved', async () => {
        wrapper
          .find('rename-step-form-stub')
          .vm.$emit('formSaved', { name: 'rename', oldname: 'columnA', newname: 'columnAA' });
        expect(store.state.isEditingStep).to.be.false;
        expect(store.state.pipeline).to.eql([
          { name: 'domain', domain: 'foo' },
          { name: 'rename', oldname: 'columnA', newname: 'columnAA' },
        ]);
      });

      it('should compute the right computedActiveStepIndex', () => {
        expect(store.getters.computedActiveStepIndex).to.eql(0);
        wrapper.find('rename-step-form-stub').vm.$emit('formSaved', {
          name: 'rename',
          oldname: 'columnA',
          newname: 'columnAA',
        });
        expect(store.getters.computedActiveStepIndex).to.eql(1);
      });
    });
  });

  it('should keep editingMode on when trying to creating a step while a form is already open', async () => {
    const store = setupStore({ isEditingStep: true });
    const wrapper = shallowMount(Vqb, { store, localVue });
    wrapper.find('dataviewer-stub').vm.$emit('stepCreated', 'rename');
    await wrapper.vm.$nextTick();
    expect(store.state.isEditingStep).to.be.true;
  });

  it('should cancel edition', async () => {
    const store = setupStore({
      pipeline: [{ name: 'domain', domain: 'foo' }],
      isEditingStep: true,
    });
    const wrapper = shallowMount(Vqb, {
      store,
      localVue,
      stubs: {
        transition: false,
      },
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
