import { shallowMount, createLocalVue } from '@vue/test-utils';
import AggregationWidget from '@/components/stepforms/widgets/Aggregation.vue';
import Vuex, { Store } from 'vuex';
import { setupMockStore } from './utils';

const localVue = createLocalVue();
localVue.use(Vuex);

describe('Widget AggregationWidget', () => {
  let emptyStore: Store<any>;
  beforeEach(() => {
    emptyStore = setupMockStore({});
  });

  it('should instantiate', () => {
    const wrapper = shallowMount(AggregationWidget, { store: emptyStore, localVue });
    expect(wrapper.exists()).toBeTruthy();
  });

  it('should have exactly two AutocompleteWidget components', () => {
    const wrapper = shallowMount(AggregationWidget, { store: emptyStore, localVue });
    const widgetWrappers = wrapper.findAll('autocompletewidget-stub');
    expect(widgetWrappers.length).toEqual(2);
  });

  it('should instantiate an widgetAutocomplete widget with proper options from the store', () => {
    const store = setupMockStore({
      dataset: {
        headers: [{ name: 'columnA' }, { name: 'columnB' }, { name: 'columnC' }],
        data: [],
      },
    });
    const wrapper = shallowMount(AggregationWidget, { store, localVue });
    const widgetWrappers = wrapper.findAll('autocompletewidget-stub');
    expect(widgetWrappers.at(0).attributes('options')).toEqual('columnA,columnB,columnC');
  });

  it('should pass down the "column" prop to the first AutocompleteWidget value prop', () => {
    const wrapper = shallowMount(AggregationWidget, {
      store: emptyStore,
      localVue,
      propsData: { value: { column: 'foo', newcolumn: '', aggfunction: 'sum' } },
    });
    const widgetWrappers = wrapper.findAll('AutocompleteWidget-stub');
    expect(widgetWrappers.at(0).props().value).toEqual('foo');
  });

  it('should pass down the "aggfunction" prop to the second AutocompleteWidget value prop', () => {
    const wrapper = shallowMount(AggregationWidget, {
      store: emptyStore,
      localVue,
      propsData: { value: { column: 'foo', newcolumn: '', aggfunction: 'avg' } },
    });
    const widgetWrappers = wrapper.findAll('AutocompleteWidget-stub');
    expect(widgetWrappers.at(1).props().value).toEqual('avg');
  });

  it('should emit "input" event on "aggregation" update', async () => {
    const wrapper = shallowMount(AggregationWidget, {
      store: emptyStore,
      localVue,
    });
    wrapper.setData({ aggregation: { column: 'bar', newcolumn: '', aggfunction: 'avg' } });
    await localVue.nextTick();
    expect(wrapper.emitted().input).toBeDefined();
    expect(wrapper.emitted().input[0]).toEqual([
      { column: 'bar', newcolumn: '', aggfunction: 'avg' },
    ]);
  });
});
