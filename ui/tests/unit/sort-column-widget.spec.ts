import { createLocalVue, shallowMount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import SortColumnWidget from '@/components/stepforms/widgets/SortColumn.vue';

const localVue = createLocalVue();

describe('Widget sort column', () => {
  it('should instantiate', () => {
    const wrapper = shallowMount(SortColumnWidget, { localVue });
    expect(wrapper.exists()).toBeTruthy();
  });

  it('should have exactly two AutocompleteWidget components', () => {
    const wrapper = shallowMount(SortColumnWidget, { localVue });
    const widgetWrappers = wrapper.findAll('autocompletewidget-stub');
    expect(widgetWrappers.length).toEqual(2);
  });

  it('should instantiate an widgetAutocomplete with proper options from the store', () => {
    const wrapper = shallowMount(SortColumnWidget, {
      localVue,
      propsData: {
        columnNames: ['columnA', 'columnB', 'columnC'],
      },
    });
    const widgetWrappers = wrapper.findAll('autocompletewidget-stub');
    expect(widgetWrappers.at(0).attributes('options')).toEqual('columnA,columnB,columnC');
  });

  it('should pass down the "column" prop to the first AutocompleteWidget value prop', async () => {
    const wrapper = shallowMount(SortColumnWidget, {
      localVue,
      propsData: {
        columnNames: ['foo'],
      },
    });
    wrapper.setProps({ value: { column: 'foo', order: 'asc' } });
    await localVue.nextTick();
    const widgetWrappers = wrapper.findAll('AutocompleteWidget-stub');
    expect(widgetWrappers.at(0).props().value).toEqual('foo');
  });

  it('should pass down the "order" prop to the second AutocompleteWidget value prop', async () => {
    const wrapper = shallowMount(SortColumnWidget, {
      localVue,
      propsData: {
        columnNames: ['foo'],
      },
    });
    wrapper.setProps({ value: { column: 'foo', order: 'desc' } });
    await localVue.nextTick();
    const widgetWrappers = wrapper.findAll('AutocompleteWidget-stub');
    expect(widgetWrappers.at(1).props().value).toEqual('desc');
  });

  it('should emit "input" event on "sortColumn" update with correct properties', () => {
    const wrapper = shallowMount(SortColumnWidget, {
      localVue,
      sync: false,
      propsData: {
        columnNames: ['bar'],
        value: { column: 'bar', order: 'desc' },
      },
    });
    wrapper.findAll('AutoCompleteWidget-stub').at(0).vm.$emit('input', 'year');
    expect(wrapper.emitted().input).toBeDefined();
    expect(wrapper.emitted().input[0]).toEqual([{ column: 'year', order: 'desc' }]);
  });

  it('should emit "input" event on "sortOrder" update with correct properties', () => {
    const wrapper = shallowMount(SortColumnWidget, {
      localVue,
      sync: false,
      propsData: {
        columnNames: ['bar'],
        value: { column: 'bar', order: 'desc' },
      },
    });
    wrapper.findAll('AutoCompleteWidget-stub').at(1).vm.$emit('input', 'asc');
    expect(wrapper.emitted().input).toBeDefined();
    expect(wrapper.emitted().input[0]).toEqual([{ column: 'bar', order: 'asc' }]);
  });
});
