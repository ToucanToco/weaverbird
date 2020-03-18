import { createLocalVue, shallowMount } from '@vue/test-utils';
import Vuex, { Store } from 'vuex';

import SortColumnWidget from '@/components/stepforms/widgets/SortColumn.vue';

import { RootState, setupMockStore } from './utils';

const localVue = createLocalVue();
localVue.use(Vuex);

describe('Widget sort column', () => {
  let emptyStore: Store<RootState>;
  beforeEach(() => {
    emptyStore = setupMockStore({});
  });

  it('should instantiate', () => {
    const wrapper = shallowMount(SortColumnWidget, { store: emptyStore, localVue });
    expect(wrapper.exists()).toBeTruthy();
  });

  it('should update value with selected value column on created', () => {
    const wrapper = shallowMount(SortColumnWidget, {
      store: emptyStore,
      localVue,
      propsData: {
        value: { column: 'bar', order: 'asc' },
      },
      sync: false,
    });
    expect(wrapper.emitted().input[0]).toEqual([{ column: 'bar', order: 'asc' }]);
  });

  it('should have exactly two AutocompleteWidget components', () => {
    const wrapper = shallowMount(SortColumnWidget, { store: emptyStore, localVue });
    const widgetWrappers = wrapper.findAll('autocompletewidget-stub');
    expect(widgetWrappers.length).toEqual(2);
  });

  it('should instantiate an widgetAutocomplete with proper options from the store', () => {
    const store = setupMockStore({
      dataset: {
        headers: [{ name: 'columnA' }, { name: 'columnB' }, { name: 'columnC' }],
        data: [],
      },
    });
    const wrapper = shallowMount(SortColumnWidget, { store, localVue });
    const widgetWrappers = wrapper.findAll('autocompletewidget-stub');
    expect(widgetWrappers.at(0).attributes('options')).toEqual('columnA,columnB,columnC');
  });

  it('should pass down the "column" prop to the first AutocompleteWidget value prop', async () => {
    const wrapper = shallowMount(SortColumnWidget, { store: emptyStore, localVue });
    wrapper.setProps({ value: { column: 'foo', order: 'asc' } });
    await localVue.nextTick();
    const widgetWrappers = wrapper.findAll('AutocompleteWidget-stub');
    expect(widgetWrappers.at(0).props().value).toEqual('foo');
  });

  it('should pass down the "order" prop to the second AutocompleteWidget value prop', async () => {
    const wrapper = shallowMount(SortColumnWidget, { store: emptyStore, localVue });
    wrapper.setProps({ value: { column: 'foo', order: 'desc' } });
    await localVue.nextTick();
    const widgetWrappers = wrapper.findAll('AutocompleteWidget-stub');
    expect(widgetWrappers.at(1).props().value).toEqual('desc');
  });

  it('should emit "input" event on "sortColumn" update with correct properties', () => {
    const wrapper = shallowMount(SortColumnWidget, {
      store: emptyStore,
      localVue,
      sync: false,
      propsData: {
        value: { column: 'bar', order: 'desc' },
      },
    });
    wrapper
      .findAll('AutoCompleteWidget-stub')
      .at(0)
      .vm.$emit('input', 'year');
    expect(wrapper.emitted().input).toBeDefined();
    expect(wrapper.emitted().input[1]).toEqual([{ column: 'year', order: 'desc' }]);
  });

  it('should emit "input" event on "sortOrder" update with correct properties', () => {
    const wrapper = shallowMount(SortColumnWidget, {
      store: emptyStore,
      localVue,
      sync: false,
      propsData: {
        value: { column: 'bar', order: 'desc' },
      },
    });
    wrapper
      .findAll('AutoCompleteWidget-stub')
      .at(1)
      .vm.$emit('input', 'asc');
    expect(wrapper.emitted().input).toBeDefined();
    expect(wrapper.emitted().input[1]).toEqual([{ column: 'bar', order: 'asc' }]);
  });
});
