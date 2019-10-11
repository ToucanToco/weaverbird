import { shallowMount, createLocalVue } from '@vue/test-utils';
import SortColumnWidget from '@/components/stepforms/widgets/SortColumn.vue';
import Vuex, { Store } from 'vuex';
import { setupMockStore, RootState } from './utils';

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

  it('should emit "input" event on "value" update', async () => {
    const wrapper = shallowMount(SortColumnWidget, {
      store: emptyStore,
      localVue,
    });
    wrapper.setProps({ value: { column: 'bar', order: 'desc' } });
    await localVue.nextTick();
    expect(wrapper.emitted().input).toBeDefined();
    expect(wrapper.emitted().input[1]).toEqual([{ column: 'bar', order: 'desc' }]);
  });
});
