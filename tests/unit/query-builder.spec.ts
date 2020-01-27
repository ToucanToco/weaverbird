import { createLocalVue, shallowMount, Wrapper } from '@vue/test-utils';
import Vue from 'vue';
import Vuex, { Store } from 'vuex';

import QueryBuilder from '@/components/QueryBuilder.vue';
import { registerModule, VQBnamespace } from '@/store';
import { VQBState } from '@/store/state';

const localVue = createLocalVue();
localVue.use(Vuex);

describe('Query Builder', () => {
  const setupStore = (initialState: any = {}): Store<VQBState> => {
    const store: Store<VQBState> = new Vuex.Store({});
    registerModule(store, initialState);

    return store;
  };

  it('should instantiate', () => {
    const wrapper = shallowMount(QueryBuilder, { store: setupStore(), localVue });
    expect(wrapper.exists()).toBeTruthy();
    expect(wrapper.vm.$store.state.isEditingStep).toBeFalsy();
  });

  it('should instantiate a AggregateStepForm component', () => {
    const store = setupStore({ currentStepFormName: 'aggregate' });
    const wrapper = shallowMount(QueryBuilder, {
      store,
      localVue,
    });
    const form = wrapper.find('aggregatestepform-stub');
    expect(form.exists()).toBeTruthy();
  });

  it('should instantiate a FormRenameStep component', () => {
    const store = setupStore({ currentStepFormName: 'rename' });
    const wrapper = shallowMount(QueryBuilder, {
      store,
      localVue,
    });
    const form = wrapper.find('renamestepform-stub');
    expect(form.exists()).toBeTruthy();
  });

  it('should instantiate a DeleteColumnStep component', () => {
    const store = setupStore({ currentStepFormName: 'delete' });
    const wrapper = shallowMount(QueryBuilder, {
      store,
      localVue,
    });
    const form = wrapper.find('deletestepform-stub');
    expect(form.exists()).toBeTruthy();
  });

  it('should instantiate a FillnaStep component', () => {
    const store = setupStore({ currentStepFormName: 'fillna' });
    const wrapper = shallowMount(QueryBuilder, {
      store,
      localVue,
    });
    const form = wrapper.find('fillnastepform-stub');
    expect(form.exists()).toBeTruthy();
  });

  it('should instantiate a DomainStep component', () => {
    const store = setupStore({ currentStepFormName: 'domain' });
    const wrapper = shallowMount(QueryBuilder, {
      store,
      localVue,
    });
    const form = wrapper.find('domainstepform-stub');
    expect(form.exists()).toBeTruthy();
  });

  describe('save step', () => {
    let store: Store<any>;
    let wrapper: Wrapper<Vue>;

    describe('when editing domain step', () => {
      beforeEach(async () => {
        store = setupStore({
          pipeline: [{ name: 'domain', domain: 'foo' }],
          currentStepFormName: 'domain',
        });
        wrapper = shallowMount(QueryBuilder, {
          store,
          localVue,
          stubs: {
            transition: true,
          },
        });
        await localVue.nextTick();
      });

      it('should update the pipeline', () => {
        wrapper.find('domainstepform-stub').vm.$emit('formSaved', {
          name: 'domain',
          domain: 'bar',
        });
        expect(store.getters[VQBnamespace('isEditingStep')]).toBeFalsy();
        expect(store.state.vqb.pipeline).toEqual([{ name: 'domain', domain: 'bar' }]);
      });

      it('should compute the right currentDomain', async () => {
        wrapper.find('domainstepform-stub').vm.$emit('formSaved', {
          name: 'domain',
          domain: 'bar',
        });
        expect(store.state.vqb.currentDomain).toEqual('bar');
      });
    });

    describe('when saving other steps', () => {
      beforeEach(async () => {
        store = setupStore({
          pipeline: [{ name: 'domain', domain: 'foo' }],
          currentStepFormName: 'rename',
        });
        wrapper = shallowMount(QueryBuilder, {
          store,
          localVue,
          stubs: {
            transition: true,
          },
        });
        await localVue.nextTick();
      });

      it('should set pipeline when form is saved', async () => {
        wrapper
          .find('renamestepform-stub')
          .vm.$emit('formSaved', { name: 'rename', oldname: 'columnA', newname: 'columnAA' });
        expect(store.getters[VQBnamespace('isEditingStep')]).toBeFalsy();
        expect(store.state.vqb.pipeline).toEqual([
          { name: 'domain', domain: 'foo' },
          { name: 'rename', oldname: 'columnA', newname: 'columnAA' },
        ]);
      });

      it('should compute the right computedActiveStepIndex', () => {
        expect(store.getters[VQBnamespace('computedActiveStepIndex')]).toEqual(0);
        wrapper.find('renamestepform-stub').vm.$emit('formSaved', {
          name: 'rename',
          oldname: 'columnA',
          newname: 'columnAA',
        });
        expect(store.getters[VQBnamespace('computedActiveStepIndex')]).toEqual(1);
      });
    });
  });

  it('should cancel edition', async () => {
    const store: Store<any> = setupStore({
      pipeline: [{ name: 'domain', domain: 'foo' }],
      currentStepFormName: 'rename',
    });
    const wrapper = shallowMount(QueryBuilder, {
      store,
      localVue,
      stubs: {
        transition: true,
      },
    });
    await localVue.nextTick();
    wrapper.find('renamestepform-stub').vm.$emit('cancel');
    expect(store.getters[VQBnamespace('isEditingStep')]).toBeFalsy();
    expect(store.state.vqb.pipeline).toEqual([{ name: 'domain', domain: 'foo' }]);
  });
});
