import { createLocalVue, shallowMount } from '@vue/test-utils';
import Vuex, { Store } from 'vuex';

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

  it('should pass down the right prop to AutocompleteWidget', () => {
    const wrapper = shallowMount(JoinColumns, {
      propsData: {
        value: ['toto', 'tata'],
      },
      store: emptyStore,
      localVue,
      sync: false,
    });
    const autocompleteWrapper = wrapper.find('autocompletewidget-stub');
    expect(autocompleteWrapper.props().value).toEqual('toto');
  });

  it('should pass down the right prop to InputTextWidget', () => {
    const wrapper = shallowMount(JoinColumns, {
      propsData: {
        value: ['toto', 'tata'],
      },
      store: emptyStore,
      localVue,
      sync: false,
    });
    const inputTextWrapper = wrapper.find('inputtextwidget-stub');
    expect(inputTextWrapper.props().value).toEqual('tata');
  });

  it('should update its value when the left column is modified', () => {
    const wrapper = shallowMount(JoinColumns, {
      propsData: {
        value: ['toto', 'tata'],
      },
      store: emptyStore,
      localVue,
      sync: false,
    });

    const autocompleteWrapper = wrapper.find('autocompletewidget-stub');
    autocompleteWrapper.vm.$emit('input', 'tutu');

    expect(wrapper.emitted().input).toBeDefined();
    expect(wrapper.emitted().input[0]).toEqual([['tutu', 'tata']]);
  });

  it('should update its value when the right column is modified', () => {
    const wrapper = shallowMount(JoinColumns, {
      propsData: {
        value: ['toto', 'tata'],
      },
      store: emptyStore,
      localVue,
      sync: false,
    });

    const inputTextWrapper = wrapper.find('inputtextwidget-stub');
    inputTextWrapper.vm.$emit('input', 'tutu');

    expect(wrapper.emitted().input).toBeDefined();
    expect(wrapper.emitted().input[0]).toEqual([['toto', 'tutu']]);
  });

  it('should update both columns when the left column is modified if the right column was empty', () => {
    const wrapper = shallowMount(JoinColumns, {
      propsData: {
        value: ['toto', ''],
      },
      store: emptyStore,
      localVue,
      sync: false,
    });

    const autocompleteWrapper = wrapper.find('autocompletewidget-stub');
    autocompleteWrapper.vm.$emit('input', 'tutu');

    expect(wrapper.emitted().input).toBeDefined();
    expect(wrapper.emitted().input[0]).toEqual([['tutu', 'tutu']]);
  });
});
