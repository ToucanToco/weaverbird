import { createLocalVue, shallowMount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import AggregationWidget from '@/components/stepforms/widgets/Aggregation.vue';

const localVue = createLocalVue();

describe('Widget AggregationWidget', () => {
  it('should instantiate', () => {
    const wrapper = shallowMount(AggregationWidget, { localVue });
    expect(wrapper.exists()).toBeTruthy();
  });

  it('should have exactly two AutocompleteWidget components', () => {
    const wrapper = shallowMount(AggregationWidget, { localVue });
    const autocompletetWrappers = wrapper.findAll('autocompletewidget-stub');
    const multiselectWrappers = wrapper.findAll('multiselectwidget-stub');
    expect(autocompletetWrappers.length).toEqual(1);
    expect(multiselectWrappers.length).toEqual(1);
  });

  it('should instantiate a MultiselectWidget widget with proper options from the store', () => {
    const wrapper = shallowMount(AggregationWidget, {
      localVue,
      propsData: {
        columnNames: ['columnA', 'columnB', 'columnC'],
      },
    });
    const widgetMultiselect = wrapper.find('multiselectwidget-stub');
    expect(widgetMultiselect.attributes('options')).toEqual('columnA,columnB,columnC');
  });

  it('should pass down the props to the MultiselectWidget value prop', async () => {
    const wrapper = shallowMount(AggregationWidget, {
      localVue,
      propsData: { value: { columns: ['foo', 'bar'], newcolumns: [''], aggfunction: 'sum' } },
    });
    const widgetMultiselect = wrapper.find('multiselectwidget-stub');
    expect(widgetMultiselect.props().value).toEqual(['foo', 'bar']);
  });

  it('should pass down the "aggfunction" prop to the second AutocompleteWidget value prop', () => {
    const wrapper = shallowMount(AggregationWidget, {
      localVue,
      propsData: { value: { column: 'foo', newcolumn: '', aggfunction: 'avg' } },
    });
    const autocompleteWrapper = wrapper.find('AutocompleteWidget-stub');
    expect(autocompleteWrapper.props().value).toEqual('avg');
  });

  it('should emit "input" event on aggregation column update', async () => {
    const wrapper = shallowMount(AggregationWidget, {
      localVue,
      propsData: { value: { columns: ['foo'], newcolumns: [''], aggfunction: 'sum' } },
    });
    wrapper.find('multiselectwidget-stub').vm.$emit('input', ['plop']);
    expect(wrapper.emitted().input).toBeDefined();
    expect(wrapper.emitted().input[0]).toEqual([
      { columns: ['plop'], newcolumns: [''], aggfunction: 'sum' },
    ]);
  });

  it('should emit "input" event on aggregation function update', async () => {
    const wrapper = shallowMount(AggregationWidget, {
      localVue,
      propsData: { value: { columns: ['foo'], newcolumns: [''], aggfunction: 'sum' } },
    });
    wrapper.find('AutocompleteWidget-stub').vm.$emit('input', 'avg');
    expect(wrapper.emitted().input).toBeDefined();
    expect(wrapper.emitted().input[0]).toEqual([
      { columns: ['foo'], newcolumns: [''], aggfunction: 'avg' },
    ]);
  });
});
