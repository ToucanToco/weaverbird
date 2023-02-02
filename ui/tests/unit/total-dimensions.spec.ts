import { createTestingPinia } from '@pinia/testing';
import { createLocalVue, shallowMount } from '@vue/test-utils';
import { PiniaVuePlugin } from 'pinia';
import { describe, expect, it, vi } from 'vitest';

import TotalDimensions from '@/components/stepforms/widgets/TotalDimensions.vue';

import { setupMockStore } from './utils';

const localVue = createLocalVue();
localVue.use(PiniaVuePlugin);
const pinia = createTestingPinia({ createSpy: vi.fn, stubActions: false });

describe('Widget AggregationWidget', () => {
  it('should instantiate', () => {
    const wrapper = shallowMount(TotalDimensions, { pinia, localVue });
    expect(wrapper.exists()).toBeTruthy();
  });

  it('should have exactly 2 input components', () => {
    const wrapper = shallowMount(TotalDimensions, { pinia, localVue });
    const autocompleteWrappers = wrapper.findAll('autocompletewidget-stub');
    expect(autocompleteWrappers.length).toEqual(1);
    const inputtextWrappers = wrapper.findAll('inputtextwidget-stub');
    expect(inputtextWrappers.length).toEqual(1);
  });

  it('should instantiate a widgetAutocomplete widget with proper options from the store', () => {
    setupMockStore({
      dataset: {
        headers: [{ name: 'columnA' }, { name: 'columnB' }, { name: 'columnC' }],
        data: [],
      },
    });
    const wrapper = shallowMount(TotalDimensions, { pinia, localVue });
    const autocompleteWrapper = wrapper.find('autocompletewidget-stub');
    expect(autocompleteWrapper.attributes('options')).toEqual('columnA,columnB,columnC');
  });

  it('should pass down the right prop to AutocompleteWidget', () => {
    const wrapper = shallowMount(TotalDimensions, {
      propsData: {
        value: { totalColumn: 'toto', totalRowsLabel: 'tata' },
      },
      pinia,
      localVue,
      sync: false,
    });
    const autocompleteWrapper = wrapper.find('autocompletewidget-stub');
    expect(autocompleteWrapper.props().value).toEqual('toto');
  });

  it('should pass down the right prop to InputTextWidget', () => {
    const wrapper = shallowMount(TotalDimensions, {
      propsData: {
        value: { totalColumn: 'toto', totalRowsLabel: 'tata' },
      },
      pinia,
      localVue,
      sync: false,
    });
    const inputTextWrapper = wrapper.find('inputtextwidget-stub');
    expect(inputTextWrapper.props().value).toEqual('tata');
  });

  it('should update its value when the column is modified', () => {
    const wrapper = shallowMount(TotalDimensions, {
      propsData: {
        value: { totalColumn: 'toto', totalRowsLabel: 'tata' },
      },
      pinia,
      localVue,
      sync: false,
    });

    const autocompleteWrapper = wrapper.find('autocompletewidget-stub');
    autocompleteWrapper.vm.$emit('input', 'tutu');

    expect(wrapper.emitted().input).toBeDefined();
    expect(wrapper.emitted().input[0]).toEqual([{ totalColumn: 'tutu', totalRowsLabel: 'tata' }]);
  });

  it('should update its value when the total rows label is modified', () => {
    const wrapper = shallowMount(TotalDimensions, {
      propsData: {
        value: { totalColumn: 'toto', totalRowsLabel: 'tata' },
      },
      pinia,
      localVue,
      sync: false,
    });

    const inputTextWrapper = wrapper.find('inputtextwidget-stub');
    inputTextWrapper.vm.$emit('input', 'tutu');

    expect(wrapper.emitted().input).toBeDefined();
    expect(wrapper.emitted().input[0]).toEqual([{ totalColumn: 'toto', totalRowsLabel: 'tutu' }]);
  });
});
