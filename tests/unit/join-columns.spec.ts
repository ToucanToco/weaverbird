import { createLocalVue, mount, shallowMount } from '@vue/test-utils';
import Vuex, { Store } from 'vuex';

import AutocompleteWidget from '@/components/stepforms/widgets/Autocomplete.vue';
import JoinColumns from '@/components/stepforms/widgets/JoinColumns.vue';

import { RootState, setupMockStore } from './utils';

const localVue = createLocalVue();
localVue.use(Vuex);

describe('Widget AggregationWidget', () => {
  let emptyStore: Store<RootState>;
  beforeEach(() => {
    emptyStore = setupMockStore({});
  });

  it('should instantiate', () => {
    const wrapper = shallowMount(JoinColumns, { store: emptyStore, localVue });
    expect(wrapper.exists()).toBeTruthy();
  });

  it('should have exactly 2 input components', () => {
    const wrapper = shallowMount(JoinColumns, { store: emptyStore, localVue });
    const autocompleteWrappers = wrapper.findAll('autocompletewidget-stub');
    expect(autocompleteWrappers.length).toEqual(1);
    const inputtextWrappers = wrapper.findAll('inputtextwidget-stub');
    expect(inputtextWrappers.length).toEqual(1);
  });

  it('should instantiate a widgetAutocomplete widget with proper options from the store', () => {
    const store = setupMockStore({
      dataset: {
        headers: [{ name: 'columnA' }, { name: 'columnB' }, { name: 'columnC' }],
        data: [],
      },
    });
    const wrapper = shallowMount(JoinColumns, { store, localVue });
    const autocompleteWrapper = wrapper.find('autocompletewidget-stub');
    expect(autocompleteWrapper.attributes('options')).toEqual('columnA,columnB,columnC');
  });

  it('should pass down the right prop to AutocompleteWidget', async () => {
    const wrapper = shallowMount(JoinColumns, { store: emptyStore, localVue });
    wrapper.setData({ joinColumns: ['toto', 'tata'] });
    await localVue.nextTick();
    const autocompleteWrapper = wrapper.find('autocompletewidget-stub');
    expect(autocompleteWrapper.props().value).toEqual('toto');
  });

  it('should pass down the right prop to InputTextWidget', async () => {
    const wrapper = shallowMount(JoinColumns, { store: emptyStore, localVue });
    wrapper.setData({ joinColumns: ['toto', 'tata'] });
    await localVue.nextTick();
    const inputTextWrapper = wrapper.find('inputtextwidget-stub');
    expect(inputTextWrapper.props().value).toEqual('tata');
  });

  it('should set joinColumns[1] = joinColumns[0] if joinColumns[0] is set while joinColumns[1] is null', async () => {
    const wrapper = mount(JoinColumns, { store: emptyStore, localVue });
    wrapper.setData({ joinColumns: ['toto', ''] });
    await localVue.nextTick();
    wrapper.find(AutocompleteWidget).trigger('input');
    await localVue.nextTick();
    expect(wrapper.vm.$data.joinColumns[1]).toEqual('toto');
  });

  it('should emit "input" event on "joinColumns" update', async () => {
    const wrapper = shallowMount(JoinColumns, {
      store: emptyStore,
      localVue,
    });
    wrapper.setData({ joinColumns: ['toto', 'tata'] });
    await localVue.nextTick();
    expect(wrapper.emitted().input).toBeDefined();
    expect(wrapper.emitted().input[1]).toEqual([['toto', 'tata']]);
  });
});
