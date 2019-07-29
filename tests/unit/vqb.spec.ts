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
    expect(wrapper.exists()).toBeTruthy();
    expect(wrapper.vm.$store.state.isEditingStep).toBeFalsy();
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
    expect(form.exists()).toBeTruthy();
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
    expect(form.exists()).toBeTruthy();
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
    expect(form.exists()).toBeTruthy();
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
    expect(form.exists()).toBeTruthy();
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
    expect(form.exists()).toBeTruthy();
  });

  it('should set editingMode on when step is created', async () => {
    const store = setupStore();
    const wrapper = shallowMount(Vqb, { store, localVue });
    expect(store.state.isEditingStep).toBeFalsy();
    wrapper.find('dataviewer-stub').vm.$emit('stepCreated', 'rename');
    await wrapper.vm.$nextTick();
    expect(store.state.isEditingStep).toBeTruthy();
  });

  describe('save step', () => {
    let store: Store<VQBState>;
    let wrapper: Wrapper<Vue>;

    describe('when editing domain step', () => {
      beforeEach(async () => {
        store = setupStore({
          pipeline: [{ name: 'domain', domain: 'foo' }],
          isEditingStep: true,
        });
        wrapper = shallowMount(Vqb, {
          store,
          localVue,
          stubs: {
            transition: true,
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
        expect(store.state.isEditingStep).toBeFalsy();
        expect(store.state.pipeline).toEqual([{ name: 'domain', domain: 'bar' }]);
      });

      it('should compute the right currentDomain', async () => {
        wrapper.find('domain-step-form-stub').vm.$emit('formSaved', {
          name: 'domain',
          domain: 'bar',
        });
        expect(store.state.currentDomain).toEqual('bar');
      });
    });

    describe('when saving other steps', () => {
      beforeEach(async () => {
        store = setupStore({
          pipeline: [{ name: 'domain', domain: 'foo' }],
          isEditingStep: true,
        });
        wrapper = shallowMount(Vqb, {
          store,
          localVue,
          stubs: {
            transition: true,
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
        expect(store.state.isEditingStep).toBeFalsy();
        expect(store.state.pipeline).toEqual([
          { name: 'domain', domain: 'foo' },
          { name: 'rename', oldname: 'columnA', newname: 'columnAA' },
        ]);
      });

      it('should compute the right computedActiveStepIndex', () => {
        expect(store.getters.computedActiveStepIndex).toEqual(0);
        wrapper.find('rename-step-form-stub').vm.$emit('formSaved', {
          name: 'rename',
          oldname: 'columnA',
          newname: 'columnAA',
        });
        expect(store.getters.computedActiveStepIndex).toEqual(1);
      });
    });
  });

  it('should keep editingMode on when trying to creating a step while a form is already open', async () => {
    const store = setupStore({ isEditingStep: true });
    const wrapper = shallowMount(Vqb, { store, localVue });
    wrapper.find('dataviewer-stub').vm.$emit('stepCreated', 'rename');
    await wrapper.vm.$nextTick();
    expect(store.state.isEditingStep).toBeTruthy();
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
        transition: true,
      },
      data: () => {
        return { formToInstantiate: 'rename-step-form' };
      },
    });
    await localVue.nextTick();
    wrapper.find('rename-step-form-stub').vm.$emit('cancel');
    expect(store.state.isEditingStep).toBeFalsy();
    expect(store.state.pipeline).toEqual([{ name: 'domain', domain: 'foo' }]);
  });
});
