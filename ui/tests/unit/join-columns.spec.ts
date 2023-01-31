import { createTestingPinia } from '@pinia/testing';
import { createLocalVue, shallowMount } from '@vue/test-utils';
import { PiniaVuePlugin } from 'pinia';
import { describe, expect, it, vi } from 'vitest';

import JoinColumns from '@/components/stepforms/widgets/JoinColumns.vue';

import { setupMockStore } from './utils';

const localVue = createLocalVue();
localVue.use(PiniaVuePlugin);
const pinia = createTestingPinia({ createSpy: vi.fn, stubActions: false });

describe('Widget JoinColumnsWidget', () => {
  it('should instantiate', () => {
    const wrapper = shallowMount(JoinColumns, { pinia, localVue });
    expect(wrapper.exists()).toBeTruthy();
  });

  it('should have exactly 2 input components', () => {
    const wrapper = shallowMount(JoinColumns, { pinia, localVue });
    const rightComponentWrappers = wrapper.findAll('.rightOn');
    const leftComponentWrappers = wrapper.findAll('.leftOn');
    expect(rightComponentWrappers.length).toEqual(1);
    expect(leftComponentWrappers.length).toEqual(1);
  });

  it('should suggest the columns of the actual dataset in the left widget', () => {
    setupMockStore({
      dataset: {
        headers: [{ name: 'columnA' }, { name: 'columnB' }, { name: 'columnC' }],
        data: [],
      },
    });
    const wrapper = shallowMount(JoinColumns, { pinia, localVue });
    const leftWidgetWrapper = wrapper.find('.leftOn');
    expect(leftWidgetWrapper.props().options).toEqual(['columnA', 'columnB', 'columnC']);
  });

  it('should pass down the value to the left widget', () => {
    const wrapper = shallowMount(JoinColumns, {
      propsData: {
        value: ['toto', 'tata'],
      },
      pinia,
      localVue,
      sync: false,
    });
    const leftWidgetWrapper = wrapper.find('.leftOn');
    expect(leftWidgetWrapper.props().value).toEqual('toto');
  });

  it('should pass down the value to the right widget', () => {
    const wrapper = shallowMount(JoinColumns, {
      propsData: {
        value: ['toto', 'tata'],
      },
      pinia,
      localVue,
      sync: false,
    });
    const rightWidgetWrapper = wrapper.find('.rightOn');
    expect(rightWidgetWrapper.props().value).toEqual('tata');
  });

  it('should pass down the columns names of the right dataset in an autocomplete if provided', () => {
    const wrapper = shallowMount(JoinColumns, {
      propsData: {
        rightColumnNames: ['meow', 'plop'],
      },
      pinia,
      localVue,
      sync: false,
    });
    const rightWidgetWrapper = wrapper.find('.rightOn');
    expect(rightWidgetWrapper.is('AutocompleteWidget-stub')).toBe(true);
    expect(rightWidgetWrapper.props().options).toEqual(['meow', 'plop']);
  });

  it('should let user freely input if right dataset column names are not provided', () => {
    const wrapper = shallowMount(JoinColumns, { pinia, localVue, sync: false });
    const rightWidgetWrapper = wrapper.find('.rightOn');
    expect(rightWidgetWrapper.is('InputTextWidget-stub')).toBe(true);
  });

  it('should update its value when the left column is modified', () => {
    const wrapper = shallowMount(JoinColumns, {
      propsData: {
        value: ['toto', 'tata'],
      },
      pinia,
      localVue,
      sync: false,
    });

    const leftWidgetWrapper = wrapper.find('.leftOn');
    leftWidgetWrapper.vm.$emit('input', 'tutu');

    expect(wrapper.emitted().input).toBeDefined();
    expect(wrapper.emitted().input[0]).toEqual([['tutu', 'tata']]);
  });

  it('should update its value when the right column is modified', () => {
    const wrapper = shallowMount(JoinColumns, {
      propsData: {
        value: ['toto', 'tata'],
      },
      pinia,
      localVue,
      sync: false,
    });

    const rightWidgetWrapper = wrapper.find('.rightOn');
    rightWidgetWrapper.vm.$emit('input', 'tutu');

    expect(wrapper.emitted().input).toBeDefined();
    expect(wrapper.emitted().input[0]).toEqual([['toto', 'tutu']]);
  });

  it('should update both columns when the left column is modified if the right column was empty', () => {
    const wrapper = shallowMount(JoinColumns, {
      propsData: {
        value: ['toto', ''],
      },
      pinia,
      localVue,
      sync: false,
    });

    const leftWidgetWrapper = wrapper.find('.leftOn');
    leftWidgetWrapper.vm.$emit('input', 'tutu');

    expect(wrapper.emitted().input).toBeDefined();
    expect(wrapper.emitted().input[0]).toEqual([['tutu', 'tutu']]);
  });
});
