import { createLocalVue, mount, shallowMount } from '@vue/test-utils';
import Vuex, { Store } from 'vuex';

import AutocompleteWidget from '@/components/stepforms/widgets/Autocomplete.vue';
import FilterSimpleConditionWidget from '@/components/stepforms/widgets/FilterSimpleCondition.vue';
import InputTextWidget from '@/components/stepforms/widgets/InputText.vue';
import MultiInputTextWidget from '@/components/stepforms/widgets/MultiInputText.vue';

import { RootState, setupMockStore } from './utils';

const localVue = createLocalVue();
localVue.use(Vuex);

describe('Widget FilterSimpleCondition', () => {
  let emptyStore: Store<RootState>;
  beforeEach(() => {
    emptyStore = setupMockStore({});
  });

  it('should instantiate', () => {
    const wrapper = shallowMount(FilterSimpleConditionWidget, { store: emptyStore, localVue });
    expect(wrapper.exists()).toBeTruthy();
  });

  it('should have exactly 3 input components', () => {
    const wrapper = shallowMount(FilterSimpleConditionWidget, { store: emptyStore, localVue });
    const autocompleteWrappers = wrapper.findAll('autocompletewidget-stub');
    expect(autocompleteWrappers.length).toEqual(2);
    const inputtextWrappers = wrapper.findAll('inputtextwidget-stub');
    expect(inputtextWrappers.length).toEqual(1);
  });

  it('should have exactly have a MultiInputTextWidget if operator is "in" or "nin"', async () => {
    const wrapper = shallowMount(FilterSimpleConditionWidget, {
      store: emptyStore,
      localVue,
      propsData: {
        value: { column: 'foo', value: [], operator: 'in' },
      },
      sync: false,
    });
    const autocompleteWrappers = wrapper.findAll('multiinputtextwidget-stub');
    expect(autocompleteWrappers.length).toEqual(1);
  });

  it('should not have any input component if operator is "isnull" or "not null"', async () => {
    const wrapper = shallowMount(FilterSimpleConditionWidget, {
      store: emptyStore,
      localVue,
      propsData: {
        value: { column: 'foo', value: [], operator: 'isnull' },
      },
      sync: false,
    });
    const inputTextWrappers = wrapper.find('inputtextwidget-stub');
    const multinnputtextWrappers = wrapper.find('multiinputtextwidget-stub');
    expect(inputTextWrappers.exists()).toBeFalsy();
    expect(multinnputtextWrappers.exists()).toBeFalsy();
  });

  it('should instantiate a widgetAutocomplete widget with column names from the store', () => {
    const store = setupMockStore({
      dataset: {
        headers: [{ name: 'columnA' }, { name: 'columnB' }, { name: 'columnC' }],
        data: [],
      },
    });
    const wrapper = shallowMount(FilterSimpleConditionWidget, { store, localVue });
    const widgetWrappers = wrapper.findAll('autocompletewidget-stub');
    expect(widgetWrappers.at(0).attributes('options')).toEqual('columnA,columnB,columnC');
  });

  it('should instantiate a widgetAutocomplete widget with column names from the prop', () => {
    const wrapper = shallowMount(FilterSimpleConditionWidget, {
      store: emptyStore,
      localVue,
      propsData: {
        columnNamesProp: ['columnA', 'columnB', 'columnC'],
      },
    });
    const widgetWrappers = wrapper.findAll('autocompletewidget-stub');
    expect(widgetWrappers.at(0).attributes('options')).toEqual('columnA,columnB,columnC');
  });

  it('should instantiate a widgetAutocomplete widget with nothing', () => {
    const wrapper = shallowMount(FilterSimpleConditionWidget, {
      store: emptyStore,
      localVue,
    });
    const widgetWrappers = wrapper.findAll('autocompletewidget-stub');
    expect(widgetWrappers.at(0).attributes('options')).toEqual('');
  });

  it('should pass down the "column" prop to the first AutocompleteWidget value prop', async () => {
    const wrapper = shallowMount(FilterSimpleConditionWidget, {
      store: emptyStore,
      localVue,
      propsData: {
        value: { column: 'foo', value: '', operator: 'eq' },
      },
      sync: false,
    });
    const widgetWrappers = wrapper.findAll('autocompletewidget-stub');
    expect(widgetWrappers.at(0).props().value).toEqual('foo');
  });

  it('should pass down the "operator" prop to the second AutocompleteWidget value prop', async () => {
    const wrapper = shallowMount(FilterSimpleConditionWidget, {
      store: emptyStore,
      localVue,
      propsData: {
        value: { column: 'foo', value: [], operator: 'nin' },
      },
      sync: false,
    });
    const widgetWrappers = wrapper.findAll('autocompletewidget-stub');
    expect(widgetWrappers.at(1).props().value).toEqual({
      operator: 'nin',
      label: 'is not one of',
      inputWidget: MultiInputTextWidget,
    });
  });

  it('should emit a new condition with the correct type of value when changing the operator', () => {
    const wrapper = shallowMount(FilterSimpleConditionWidget, {
      store: emptyStore,
      localVue,
      propsData: { dataPath: '.condition' },
      sync: false,
    });
    // default emitted value
    expect(wrapper.emitted().input[0]).toEqual([{ column: '', value: '', operator: 'eq' }]);
    const operatorWrapper = wrapper.findAll('autocompletewidget-stub').at(1);

    // in operator
    operatorWrapper.vm.$emit('input', { operator: 'in' });
    expect(wrapper.emitted().input[1]).toEqual([{ column: '', value: [], operator: 'in' }]);

    // isnull operator
    operatorWrapper.vm.$emit('input', { operator: 'isnull' });
    expect(wrapper.emitted().input[2]).toEqual([{ column: '', value: null, operator: 'isnull' }]);

    // matches operator
    operatorWrapper.vm.$emit('input', { operator: 'matches' });
    expect(wrapper.emitted().input[3]).toEqual([{ column: '', value: '', operator: 'matches' }]);
  });

  it('should the widget accordingly when changing the operator', async () => {
    const wrapper = shallowMount(FilterSimpleConditionWidget, {
      store: emptyStore,
      localVue,
      propsData: { dataPath: '.condition' },
      sync: false,
    });
    expect(wrapper.emitted().input[0]).toEqual([{ column: '', value: '', operator: 'eq' }]);

    // in operator
    wrapper.setProps({
      value: { column: '', value: [], operator: 'in' },
    });
    await wrapper.vm.$nextTick();
    let valueInputWrapper = wrapper.find('.condition-filterValue');
    expect(valueInputWrapper.is(MultiInputTextWidget)).toBe(true);
    expect(valueInputWrapper.attributes('placeholder')).toEqual('Enter a value');

    // isnull operator
    wrapper.setProps({
      value: { column: '', value: null, operator: 'isnull' },
    });
    await wrapper.vm.$nextTick();
    valueInputWrapper = wrapper.find('.condition-filterValue');
    expect(valueInputWrapper.exists()).toBeFalsy();

    // matches operator
    wrapper.setProps({
      value: { column: '', value: '', operator: 'matches' },
    });
    await wrapper.vm.$nextTick();
    valueInputWrapper = wrapper.find('.condition-filterValue');
    expect(valueInputWrapper.is(InputTextWidget)).toBe(true);
    expect(valueInputWrapper.attributes('placeholder')).toEqual('Enter a regex, e.g. "[Ss]ales"');
  });

  it('should emit input when changing the column', async () => {
    const wrapper = shallowMount(FilterSimpleConditionWidget, {
      store: emptyStore,
      localVue,
      propsData: { dataPath: '.condition' },
      sync: false,
    });
    expect(wrapper.emitted().input[0]).toEqual([{ column: '', value: '', operator: 'eq' }]);

    const columnInputWrapper = wrapper.findAll('autocompletewidget-stub').at(0);
    columnInputWrapper.vm.$emit('input', 'foo');
    await wrapper.vm.$nextTick();
    expect(wrapper.emitted().input[1]).toEqual([{ column: 'foo', value: '', operator: 'eq' }]);
  });

  it('should emit input when changing the value', async () => {
    const wrapper = shallowMount(FilterSimpleConditionWidget, {
      store: emptyStore,
      localVue,
      propsData: { dataPath: '.condition' },
      sync: false,
    });
    expect(wrapper.emitted().input[0]).toEqual([{ column: '', value: '', operator: 'eq' }]);

    const valueInputWrapper = wrapper.find('.condition-filterValue');
    valueInputWrapper.vm.$emit('input', 'toto');
    await wrapper.vm.$nextTick();
    expect(wrapper.emitted().input[1]).toEqual([{ column: '', value: 'toto', operator: 'eq' }]);
  });

  it('should update selectedColumn when column is changed', async () => {
    const store = setupMockStore({
      dataset: {
        headers: [{ name: 'columnA' }, { name: 'columnB' }, { name: 'columnC' }],
        data: [],
      },
      selectedColumns: ['columnA'],
    });
    const wrapper = mount(FilterSimpleConditionWidget, {
      propsData: {
        value: { column: 'columnA', value: 'bar', operator: 'eq' },
      },
      store,
      localVue,
      sync: false,
    });
    wrapper.find(AutocompleteWidget).vm.$emit('input', 'columnB');
    await wrapper.vm.$nextTick();
    expect(store.state.vqb.selectedColumns).toEqual(['columnB']);
  });
});
