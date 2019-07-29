import { mount, shallowMount, createLocalVue } from '@vue/test-utils';
import FilterSimpleConditionWidget from '@/components/stepforms/widgets/FilterSimpleCondition.vue';
import AutocompleteWidget from '@/components/stepforms/widgets/Autocomplete.vue';
import MultiInputTextWidget from '@/components/stepforms/widgets/MultiInputText.vue';
import Vuex, { Store } from 'vuex';
import { setupStore } from '@/store';
import { VQBState } from '@/store/state';

const localVue = createLocalVue();
localVue.use(Vuex);

describe('Widget AggregationWidget', () => {
  let emptyStore: Store<VQBState>;
  beforeEach(() => {
    emptyStore = setupStore({});
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
    const wrapper = shallowMount(FilterSimpleConditionWidget, { store: emptyStore, localVue });
    wrapper.setData({ editedValue: { column: 'foo', value: [], operator: 'in' } });
    await localVue.nextTick();
    const autocompleteWrappers = wrapper.findAll('multiinputtextwidget-stub');
    expect(autocompleteWrappers.length).toEqual(1);
  });

  it('should instantiate a widgetAutocomplete widget with proper options from the store', () => {
    const store = setupStore({
      dataset: {
        headers: [{ name: 'columnA' }, { name: 'columnB' }, { name: 'columnC' }],
        data: [],
      },
    });
    const wrapper = shallowMount(FilterSimpleConditionWidget, { store, localVue });
    const widgetWrappers = wrapper.findAll('autocompletewidget-stub');
    expect(widgetWrappers.at(0).attributes('options')).toEqual('columnA,columnB,columnC');
  });

  it('should pass down the "column" prop to the first AutocompleteWidget value prop', async () => {
    const wrapper = shallowMount(FilterSimpleConditionWidget, { store: emptyStore, localVue });
    wrapper.setData({ editedValue: { column: 'foo', value: '', operator: 'eq' } });
    await localVue.nextTick();
    const widgetWrappers = wrapper.findAll('autocompletewidget-stub');
    expect(widgetWrappers.at(0).props().value).toEqual('foo');
  });

  it('should pass down the "operator" prop to the second AutocompleteWidget value prop', async () => {
    const wrapper = shallowMount(FilterSimpleConditionWidget, { store: emptyStore, localVue });
    wrapper.setData({ editedValue: { column: 'foo', value: [], operator: 'nin' } });
    await localVue.nextTick();
    const widgetWrappers = wrapper.findAll('autocompletewidget-stub');
    expect(widgetWrappers.at(1).props().value).toEqual({
      operator: 'nin',
      label: 'not be among',
      inputWidget: MultiInputTextWidget,
    });
  });

  it('should change the type of value accordingly when switching the "operator"', async () => {
    const wrapper = shallowMount(FilterSimpleConditionWidget, { store: emptyStore, localVue });
    expect((wrapper.vm.$data.editedValue.value = ''));
    wrapper.setData({ editedValue: { column: 'foo', value: [], operator: 'in' } });
    const operatorWrapper = wrapper.findAll('autocompletewidget-stub').at(1);
    await operatorWrapper.trigger('input', { value: 'be among' });
    expect((wrapper.vm.$data.editedValue.value = []));
  });

  it('should emit "input" event on "editedValue" update', async () => {
    const wrapper = shallowMount(FilterSimpleConditionWidget, {
      store: emptyStore,
      localVue,
    });
    wrapper.setData({ editedValue: { column: 'foo', value: 'bar', operator: 'gt' } });
    await localVue.nextTick();
    expect(wrapper.emitted().input).toBeDefined();
    expect(wrapper.emitted().input[0]).toEqual([{ column: 'foo', value: 'bar', operator: 'gt' }]);
  });

  it('should update selectedColumn when column is changed', async () => {
    const store = setupStore({
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
    });
    wrapper.setData({ editedValue: { column: 'columnB', value: 'bar', operator: 'eq' } });
    await wrapper.find(AutocompleteWidget).trigger('input');
    expect(store.state.selectedColumns).toEqual(['columnB']);
  });
});
