import { createLocalVue, shallowMount } from '@vue/test-utils';
import Vuex, { Store } from 'vuex';

import ColumnPicker from '@/components/stepforms/ColumnPicker.vue';
import { VQBnamespace } from '@/store';

import { RootState, setupMockStore } from './utils';

const localVue = createLocalVue();
localVue.use(Vuex);

describe('Column Picker', () => {
  let emptyStore: Store<RootState>;
  beforeEach(() => {
    emptyStore = setupMockStore({});
  });

  it('should instantiate', () => {
    const wrapper = shallowMount(ColumnPicker, { store: emptyStore, localVue });
    expect(wrapper.exists()).toBeTruthy();
  });

  it('should have a widget autocomplete', () => {
    const wrapper = shallowMount(ColumnPicker, { store: emptyStore, localVue });
    expect(wrapper.find('autocompletewidget-stub').exists()).toBeTruthy();
  });

  it('should instantiate an autocomplete widget with proper options from the store', () => {
    const store = setupMockStore({
      dataset: {
        headers: [{ name: 'columnA' }, { name: 'columnB' }, { name: 'columnC' }],
        data: [],
      },
    });
    const wrapper = shallowMount(ColumnPicker, { store, localVue });
    const selectWrapper = wrapper.find('autocompletewidget-stub');
    expect(selectWrapper.attributes('options')).toEqual('columnA,columnB,columnC');
  });

  it('should set column when initial column value is set', () => {
    const store = setupMockStore({
      dataset: {
        headers: [{ name: 'columnA' }, { name: 'columnB' }, { name: 'columnC' }],
        data: [],
      },
    });
    const wrapper = shallowMount(ColumnPicker, {
      store,
      localVue,
      propsData: {
        value: 'columnA',
      },
    });
    expect(wrapper.find('autocompletewidget-stub').props().value).toEqual('columnA');
  });

  it('should update the column when a column is selected in the data table', async () => {
    const store = setupMockStore({
      dataset: {
        headers: [{ name: 'columnA' }, { name: 'columnB' }, { name: 'columnC' }],
        data: [],
      },
      selectedColumns: ['columnA'],
    });
    const wrapper = shallowMount(ColumnPicker, {
      store,
      localVue,
    });

    // On created, the selected column must be the one selected in the table
    expect(wrapper.emitted('input')[0][0]).toEqual('columnA');

    // When selecting another column, the form should update
    store.commit(VQBnamespace('setSelectedColumns'), { column: 'columnB' });
    expect(store.state.vqb.selectedColumns).toEqual(['columnB']);
    await wrapper.vm.$nextTick();
    expect(wrapper.emitted('input')[1][0]).toEqual('columnB');

    // When the form updates, the selection in the table should also change
    // Note: we can't directly call wrapper.find('AutocompleteWidget-stub') because vue-test-utils would return the same vm as it's parent, because it's an only child, and therefore ties to the same HTML element
    wrapper.vm.$children[0].$emit('input', 'columnC');
    expect(wrapper.emitted('input')[2][0]).toEqual('columnC');
    expect(store.state.vqb.selectedColumns).toEqual(['columnC']);
  });

  it('should update the column when a column is selected in the data table when `syncWithSelectedColumn` is disabled', async () => {
    const store = setupMockStore({
      dataset: {
        headers: [{ name: 'columnA' }, { name: 'columnB' }, { name: 'columnC' }],
        data: [],
      },
      selectedColumns: ['columnA'],
    });
    const wrapper = shallowMount(ColumnPicker, {
      store,
      localVue,
      propsData: {
        syncWithSelectedColumn: false,
      },
    });

    // On created, the form should not update

    expect(wrapper.emitted('input')).toBeUndefined();
    // Nor on subsequent selections in the data table

    store.commit(VQBnamespace('setSelectedColumns'), { column: 'columnB' });
    expect(store.state.vqb.selectedColumns).toEqual(['columnB']);
    expect(wrapper.emitted('input')).toBeUndefined();

    // When the form updates, the selection in the table should not change
    wrapper.vm.$children[0].$emit('input', 'columnC');
    expect(wrapper.emitted('input')[0][0]).toEqual('columnC');
    expect(store.state.vqb.selectedColumns).toEqual(['columnB']);
  });
});
