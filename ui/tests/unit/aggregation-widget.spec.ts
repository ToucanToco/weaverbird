import { createLocalVue, shallowMount } from '@vue/test-utils';
import Vuex, { Store } from 'vuex';

import AggregationWidget from '@/components/stepforms/widgets/Aggregation.vue';

import { RootState, setupMockStore } from './utils';

const localVue = createLocalVue();
localVue.use(Vuex);

describe('Widget AggregationWidget', () => {
  let emptyStore: Store<RootState>;
  beforeEach(() => {
    emptyStore = setupMockStore({});
  });

  it('should instantiate', () => {
    const wrapper = shallowMount(AggregationWidget, { store: emptyStore, localVue });
    expect(wrapper.exists()).toBeTruthy();
  });

  it('should have exactly two AutocompleteWidget components', () => {
    const wrapper = shallowMount(AggregationWidget, { store: emptyStore, localVue });
    const autocompletetWrappers = wrapper.findAll('autocompletewidget-stub');
    const multiselectWrappers = wrapper.findAll('multiselectwidget-stub');
    expect(autocompletetWrappers.length).toEqual(1);
    expect(multiselectWrappers.length).toEqual(1);
  });

  it('should instantiate a MultiselectWidget widget with proper options from the store', () => {
    const store = setupMockStore({
      dataset: {
        headers: [{ name: 'columnA' }, { name: 'columnB' }, { name: 'columnC' }],
        data: [],
      },
    });
    const wrapper = shallowMount(AggregationWidget, { store, localVue });
    const widgetMultiselect = wrapper.find('multiselectwidget-stub');
    expect(widgetMultiselect.attributes('options')).toEqual('columnA,columnB,columnC');
  });

  it('should pass down the props to the MultiselectWidget value prop', async () => {
    const wrapper = shallowMount(AggregationWidget, {
      store: emptyStore,
      localVue,
      propsData: { value: { columns: ['foo', 'bar'], newcolumns: [''], aggfunction: 'sum' } },
    });
    const widgetMultiselect = wrapper.find('multiselectwidget-stub');
    expect(widgetMultiselect.props().value).toEqual(['foo', 'bar']);
  });

  it('should pass down the "aggfunction" prop to the second AutocompleteWidget value prop', () => {
    const wrapper = shallowMount(AggregationWidget, {
      store: emptyStore,
      localVue,
      propsData: { value: { column: 'foo', newcolumn: '', aggfunction: 'avg' } },
    });
    const autocompleteWrapper = wrapper.find('AutocompleteWidget-stub');
    expect(autocompleteWrapper.props().value).toEqual('avg');
  });

  it('should emit "input" event on aggregation column update', async () => {
    const wrapper = shallowMount(AggregationWidget, {
      store: emptyStore,
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
      store: emptyStore,
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
