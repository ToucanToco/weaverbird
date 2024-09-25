import { createTestingPinia } from '@pinia/testing';
import type { Wrapper } from '@vue/test-utils';
import { createLocalVue, shallowMount } from '@vue/test-utils';
import { PiniaVuePlugin } from 'pinia';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import QueryBuilder from '@/components/QueryBuilder.vue';
import { useVQBStore } from '@/store';

import { version } from '../../package.json';
import { buildStateWithOnePipeline, setupMockStore } from './utils';

const localVue = createLocalVue();
localVue.use(PiniaVuePlugin);
const pinia = createTestingPinia({ createSpy: vi.fn, stubActions: false });

describe('Query Builder', () => {
  let wrapper: Wrapper<QueryBuilder>;
  let store: ReturnType<typeof setupMockStore>;

  afterEach(() => {
    useVQBStore().$dispose();
    wrapper.destroy();
  });

  it('should instantiate', () => {
    store = setupMockStore();
    wrapper = shallowMount(QueryBuilder, { pinia, localVue });
    expect(wrapper.exists()).toBeTruthy();
    expect(store.isEditingStep).toBeFalsy();
  });

  it('should display the current version of the package', () => {
    setupMockStore();
    wrapper = shallowMount(QueryBuilder, { pinia, localVue });
    expect(wrapper.find('.documentation-help__content').attributes('data-version')).toBe(version);
  });

  it('should display an empty state if no pipeline is selected', () => {
    setupMockStore({});
    wrapper = shallowMount(QueryBuilder, { pinia, localVue });
    expect(wrapper.find('.query-builder--no-pipeline').exists()).toBeTruthy();
    expect(wrapper.find('Pipeline-stub').exists()).toBeFalsy();
  });

  it('should instantiate a step form component', () => {
    setupMockStore(buildStateWithOnePipeline([], { currentStepFormName: 'aggregate' }));
    wrapper = shallowMount(QueryBuilder, {
      pinia,
      localVue,
    });
    const form = wrapper.find('stepform-stub');
    expect(form.exists()).toBeTruthy();
  });

  describe('save step', () => {
    describe('when editing a step', () => {
      beforeEach(async () => {
        store = setupMockStore(
          buildStateWithOnePipeline([
            { name: 'domain', domain: 'foo' },
            { name: 'rename', toRename: [['baz', 'spam']] },
            { name: 'replace', searchColumn: 'test', toReplace: [] },
          ]),
        );
        wrapper = shallowMount(QueryBuilder, {
          pinia,
          localVue,
          stubs: {
            transition: true,
          },
        });
        store.logBackendMessages({
          backendMessages: [{ type: 'error', index: 1, message: 'anError' }],
        });
      });
      it('should pass the backendError to step component if any', async () => {
        wrapper.find('Pipeline-stub').vm.$emit('editStep', { name: 'rename' }, 1);
        await localVue.nextTick();
        expect(wrapper.find({ ref: 'step' }).props('backendError')).toStrictEqual('anError');
      });
      it('should pass undefined to step component if there is no backendError', async () => {
        wrapper.find('Pipeline-stub').vm.$emit('editStep', { name: 'replace' }, 2);
        await localVue.nextTick();
        expect(wrapper.find({ ref: 'step' }).props('backendError')).toBeUndefined();
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
          pinia,
          localVue,
          stubs: {
            transition: true,
          },
        });
        await localVue.nextTick();
      });

      it('should set pipeline when form is saved', async () => {
        wrapper
          .find('stepform-stub')
          .vm.$emit('formSaved', { name: 'rename', oldname: 'columnA', newname: 'columnAA' });
        expect(store.isEditingStep).toBeFalsy();
        expect(store.pipeline).toEqual([
          { name: 'domain', domain: 'foo' },
          { name: 'rename', oldname: 'columnA', newname: 'columnAA' },
        ]);
      });

      it('should compute the right computedActiveStepIndex', () => {
        expect(store.computedActiveStepIndex).toEqual(0);
        wrapper.find('stepform-stub').vm.$emit('formSaved', {
          name: 'rename',
          oldname: 'columnA',
          newname: 'columnAA',
        });
        expect(store.computedActiveStepIndex).toEqual(1);
      });
    });
  });

  it('should cancel edition', async () => {
    store = setupMockStore(
      buildStateWithOnePipeline([{ name: 'domain', domain: 'foo' }], {
        currentStepFormName: 'rename',
      }),
    );
    const wrapper = shallowMount(QueryBuilder, {
      pinia,
      localVue,
      stubs: {
        transition: true,
      },
    });
    await localVue.nextTick();
    wrapper.find('stepform-stub').vm.$emit('back');
    expect(store.isEditingStep).toBeFalsy();
    expect(store.pipeline).toEqual([{ name: 'domain', domain: 'foo' }]);
  });
});
