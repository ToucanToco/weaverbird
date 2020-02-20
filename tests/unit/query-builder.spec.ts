import { createLocalVue, shallowMount, Wrapper } from '@vue/test-utils';
import Vue from 'vue';
import Vuex, { Store } from 'vuex';

import QueryBuilder from '@/components/QueryBuilder.vue';
import { VQBnamespace } from '@/store';

import { buildStateWithOnePipeline, setupMockStore } from './utils';

const localVue = createLocalVue();
localVue.use(Vuex);

describe('Query Builder', () => {
  it('should instantiate', () => {
    const wrapper = shallowMount(QueryBuilder, { store: setupMockStore(), localVue });
    expect(wrapper.exists()).toBeTruthy();
    expect(wrapper.vm.$store.state.isEditingStep).toBeFalsy();
  });

  it('should instantiate a AggregateStepForm component', () => {
    const store = setupMockStore({ currentStepFormName: 'aggregate' });
    const wrapper = shallowMount(QueryBuilder, {
      store,
      localVue,
    });
    const form = wrapper.find('aggregatestepform-stub');
    expect(form.exists()).toBeTruthy();
  });

  it('should instantiate a FormRenameStep component', () => {
    const store = setupMockStore({ currentStepFormName: 'rename' });
    const wrapper = shallowMount(QueryBuilder, {
      store,
      localVue,
    });
    const form = wrapper.find('renamestepform-stub');
    expect(form.exists()).toBeTruthy();
  });

  it('should instantiate a DeleteColumnStep component', () => {
    const store = setupMockStore({ currentStepFormName: 'delete' });
    const wrapper = shallowMount(QueryBuilder, {
      store,
      localVue,
    });
    const form = wrapper.find('deletestepform-stub');
    expect(form.exists()).toBeTruthy();
  });

  it('should instantiate a FillnaStep component', () => {
    const store = setupMockStore({ currentStepFormName: 'fillna' });
    const wrapper = shallowMount(QueryBuilder, {
      store,
      localVue,
    });
    const form = wrapper.find('fillnastepform-stub');
    expect(form.exists()).toBeTruthy();
  });

  it('should instantiate a DomainStep component', () => {
    const store = setupMockStore({ currentStepFormName: 'domain' });
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
        store = setupMockStore(
          buildStateWithOnePipeline([{ name: 'domain', domain: 'foo' }], {
            currentStepFormName: 'domain',
          }),
        );
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
        expect(store.getters[VQBnamespace('pipeline')]).toEqual([
          { name: 'domain', domain: 'bar' },
        ]);
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
        store = setupMockStore(
          buildStateWithOnePipeline([{ name: 'domain', domain: 'foo' }], {
            currentStepFormName: 'rename',
          }),
        );
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
        expect(store.getters[VQBnamespace('pipeline')]).toEqual([
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
    const store: Store<any> = setupMockStore(
      buildStateWithOnePipeline([{ name: 'domain', domain: 'foo' }], {
        currentStepFormName: 'rename',
      }),
    );
    const wrapper = shallowMount(QueryBuilder, {
      store,
      localVue,
      stubs: {
        transition: true,
      },
    });
    await localVue.nextTick();
    wrapper.find('renamestepform-stub').vm.$emit('back');
    expect(store.getters[VQBnamespace('isEditingStep')]).toBeFalsy();
    expect(store.getters[VQBnamespace('pipeline')]).toEqual([{ name: 'domain', domain: 'foo' }]);
  });
});
