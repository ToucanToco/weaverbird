import { createLocalVue, shallowMount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import ColumnPicker from '@/components/stepforms/ColumnPicker.vue';

const localVue = createLocalVue();

describe('Column Picker', () => {
  it('should instantiate', () => {
    const wrapper = shallowMount(ColumnPicker, { localVue });
    expect(wrapper.exists()).toBeTruthy();
  });

  it('should have a widget autocomplete', () => {
    const wrapper = shallowMount(ColumnPicker, { localVue });
    expect(wrapper.find('autocompletewidget-stub').exists()).toBeTruthy();
  });

  it('should instantiate an autocomplete widget with proper options from the store', () => {
    const wrapper = shallowMount(ColumnPicker, {
      localVue,
      propsData: {
        columnNames: ['columnA', 'columnB', 'columnC'],
      },
    });
    const selectWrapper = wrapper.find('autocompletewidget-stub');
    expect(selectWrapper.attributes('options')).toEqual('columnA,columnB,columnC');
  });

  it('should set column when initial column value is set', () => {
    const wrapper = shallowMount(ColumnPicker, {
      localVue,
      propsData: {
        value: 'columnA',
        selectedColumns: ['columnA'],
        columnNames: ['columnA', 'columnB', 'columnC'],
      },
    });
    expect(wrapper.find('autocompletewidget-stub').props().value).toEqual('columnA');
  });

  it('should update the column when a column is selected in the data table', async () => {
    const wrapper = shallowMount(ColumnPicker, {
      localVue,
      propsData: {
        selectedColumns: ['columnA'],
        columnNames: ['columnA', 'columnB', 'columnC'],
      },
    });

    // On created, the selected column must be the one selected in the table
    expect(wrapper.emitted('input')[0][0]).toEqual('columnA');

    // When selecting another column, the form should update
    wrapper.setProps({ selectedColumns: ['columnB'] });
    await wrapper.vm.$nextTick();
    expect(wrapper.emitted('input')[1][0]).toEqual('columnB');

    // When the form updates, the selection in the table should also change
    // Note: we can't directly call wrapper.find('AutocompleteWidget-stub') because vue-test-utils would return the same vm as it's parent, because it's an only child, and therefore ties to the same HTML element
    wrapper.vm.$children[0].$emit('input', 'columnC');
    expect(wrapper.emitted('input')[2][0]).toEqual('columnC');
    expect(wrapper.emitted().setSelectedColumns).toEqual([[{ column: 'columnC' }]]);
  });

  it('should update the column when a column is selected in the data table when `syncWithSelectedColumn` is disabled', async () => {
    const wrapper = shallowMount(ColumnPicker, {
      localVue,
      propsData: {
        selectedColumns: ['columnA'],
        columnNames: ['columnA', 'columnB', 'columnC'],
        syncWithSelectedColumn: false,
      },
    });

    // On created, the form should not update

    expect(wrapper.emitted('input')).toBeUndefined();
    // Nor on subsequent selections in the data table

    wrapper.setProps({ selectedColumns: ['columnB'] });
    expect(wrapper.emitted('input')).toBeUndefined();

    // When the form updates, the selection in the table should not change
    wrapper.vm.$children[0].$emit('input', 'columnC');
    expect(wrapper.emitted('input')[0][0]).toEqual('columnC');
    expect(wrapper.emitted().setSelectedColumns).toBeUndefined();
  });
});
