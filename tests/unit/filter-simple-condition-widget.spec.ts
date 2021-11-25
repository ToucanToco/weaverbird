import { createLocalVue, mount, shallowMount, Wrapper } from '@vue/test-utils';
import Vuex, { Store } from 'vuex';

import AutocompleteWidget from '@/components/stepforms/widgets/Autocomplete.vue';
import FilterSimpleConditionWidget from '@/components/stepforms/widgets/FilterSimpleCondition.vue';
import InputTextWidget from '@/components/stepforms/widgets/InputText.vue';
import MultiInputTextWidget from '@/components/stepforms/widgets/MultiInputText.vue';

import { RootState, setupMockStore } from './utils';

const localVue = createLocalVue();
localVue.use(Vuex);

const AVAILABLE_VARIABLES_SAMPLE = [
  {
    category: 'date',
    value: new Date(),
    label: 'Date category',
  },
  {
    category: 'string',
    value: 'string',
    label: 'Simple string',
  },
  {
    category: 'number',
    value: 3,
    label: 'Number',
  },
  {
    category: 'other',
    value: new Date(),
    label: 'Date not in date category',
  },
];

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
    let valueInputWrapper = wrapper.find('.filterValue');
    expect(valueInputWrapper.is(MultiInputTextWidget)).toBe(true);
    expect(valueInputWrapper.attributes('placeholder')).toEqual('Enter a value');

    // isnull operator
    wrapper.setProps({
      value: { column: '', value: null, operator: 'isnull' },
    });
    await wrapper.vm.$nextTick();
    valueInputWrapper = wrapper.find('.filterValue');
    expect(valueInputWrapper.exists()).toBeFalsy();

    // matches operator
    wrapper.setProps({
      value: { column: '', value: '', operator: 'matches' },
    });
    await wrapper.vm.$nextTick();
    valueInputWrapper = wrapper.find('.filterValue');
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

    const valueInputWrapper = wrapper.find('.filterValue');
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

  it('should keep value when operator is changed and types match', async () => {
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
    wrapper.find('.filterOperator').vm.$emit('input', { operator: 'ne' });
    await wrapper.vm.$nextTick();
    expect(wrapper.emitted().input[0]).toEqual([
      { column: 'columnA', value: 'bar', operator: 'ne' },
    ]);
  });

  it("should replace value with default when operator is changed and types don't match", async () => {
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
    wrapper.find('.filterOperator').vm.$emit('input', { operator: 'in' });
    await wrapper.vm.$nextTick();
    expect(wrapper.emitted().input[0]).toEqual([{ column: 'columnA', value: [], operator: 'in' }]);
  });

  describe('date column and date', () => {
    let wrapper: Wrapper<FilterSimpleConditionWidget>;
    const createWrapper = (mountType: Function, customProps: any = {}) => {
      const store = setupMockStore({
        dataset: {
          headers: [{ name: 'columnA' }, { name: 'columnB' }, { name: 'columnC' }],
          data: [],
        },
        selectedColumns: ['columnA'],
        featureFlags: {
          RELATIVE_DATE_FILTERING: 'enable',
        },
      });
      wrapper = mountType(FilterSimpleConditionWidget, {
        propsData: {
          value: { column: 'columnA', value: new Date('2021-01-01'), operator: 'from' },
          columnTypes: { columnA: 'date' },
          availableVariables: AVAILABLE_VARIABLES_SAMPLE,
          ...customProps,
        },
        store,
        localVue,
        sync: false,
      });
    };

    it('should have specific operators', () => {
      createWrapper(shallowMount);
      const operators = wrapper
        .find('.filterOperator')
        .props()
        .options.map((o: any) => o.operator);
      expect(operators).toStrictEqual(['from', 'until', 'isnull', 'notnull']);
    });

    it('should filter available variables to keep only date once', () => {
      createWrapper(shallowMount);
      const variables = wrapper
        .find('.filterValue')
        .props()
        .availableVariables.map((v: any) => v.label);
      expect(variables).toStrictEqual(['Date category', 'Date not in date category']);
    });

    it('should use the widget accordingly when changing the operator', async () => {
      createWrapper(mount);
      // from operator (from mount)
      expect(wrapper.find('.filterValue').classes()).toContain('widget-date-input');
      // until operator
      wrapper.setProps({
        value: { column: 'columnA', value: new Date('2021-01-01'), operator: 'until' },
      });
      await wrapper.vm.$nextTick();
      expect(wrapper.find('.filterValue').classes()).toContain('widget-date-input');
      // isnull operator
      wrapper.setProps({
        value: { column: 'columnA', value: null, operator: 'isnull' },
      });
      await wrapper.vm.$nextTick();
      expect(wrapper.find('.filterValue').exists()).toBeFalsy();
    });

    it('should emit a new condition with the correct type of value when changing the operator', () => {
      createWrapper(shallowMount);
      const operatorWrapper = wrapper.findAll('autocompletewidget-stub').at(1);
      // until operator
      operatorWrapper.vm.$emit('input', { operator: 'until' });
      expect(wrapper.emitted().input[0]).toEqual([
        { column: 'columnA', value: new Date('2021-01-01'), operator: 'until' },
      ]);
      // isnull operator
      operatorWrapper.vm.$emit('input', { operator: 'isnull' });
      expect(wrapper.emitted().input[1]).toEqual([
        { column: 'columnA', value: null, operator: 'isnull' },
      ]);
      // notnull operator
      operatorWrapper.vm.$emit('input', { operator: 'notnull' });
      expect(wrapper.emitted().input[2]).toEqual([
        { column: 'columnA', value: null, operator: 'notnull' },
      ]);
    });
    it('should transform invalid dates to valid date when changing the operator', () => {
      createWrapper(shallowMount, {
        value: { column: 'columnA', value: 1, operator: 'matches' },
      });
      const operatorWrapper = wrapper.findAll('autocompletewidget-stub').at(1);
      // from operator
      operatorWrapper.vm.$emit('input', { operator: 'from' });
      expect(wrapper.emitted().input[0]).toEqual([
        { column: 'columnA', value: '', operator: 'from' },
      ]);
    });
    it('should transform invalid dates to valid date when changing the column type', async () => {
      createWrapper(shallowMount, {
        value: { column: 'columnA', value: new Date('2021-01-01'), operator: 'from' },
      });
      wrapper.setProps({ columnTypes: { columnA: 'string' } });
      await wrapper.vm.$nextTick();
      // relaunch operator validation automatically when changing the column type
      expect(wrapper.emitted().input[0]).toEqual([
        { column: 'columnA', value: '', operator: 'eq' },
      ]);
    });

    it('should not pass the variables props if hideColumnVariables is true', () => {
      const customProps = {
        availableVariables: ['test'],
        variableDelimiters: ['test'],
        hideColumnVariables: true,
      };
      createWrapper(mount, customProps);
      const widgetWrappers = wrapper.findAll('.columnInput');
      const props = widgetWrappers.at(0).props();
      expect(props.availableVariables).toBe(undefined);
      expect(props.variableDelimiters).toBe(undefined);
    });
  });

  describe('date column and date (without relative date filtering)', () => {
    let wrapper: Wrapper<FilterSimpleConditionWidget>;
    const createWrapper = (mountType: Function, customProps: any = {}) => {
      const store = setupMockStore({
        dataset: {
          headers: [{ name: 'columnA' }, { name: 'columnB' }, { name: 'columnC' }],
          data: [],
        },
        selectedColumns: ['columnA'],
      });
      wrapper = mountType(FilterSimpleConditionWidget, {
        propsData: {
          value: { column: 'columnA', value: new Date('2021-01-01'), operator: 'eq' },
          columnTypes: { columnA: 'date' },
          availableVariables: AVAILABLE_VARIABLES_SAMPLE,
          ...customProps,
        },
        store,
        localVue,
        sync: false,
      });
    };

    it('should use default operators', () => {
      createWrapper(shallowMount);
      const operators = wrapper
        .find('.filterOperator')
        .props()
        .options.map((o: any) => o.operator);
      expect(operators).not.toContain('from');
      expect(operators).not.toContain('until');
      expect(operators).not.toHaveLength(0);
    });

    it('should use all available variables', () => {
      createWrapper(shallowMount);
      expect(wrapper.find('.filterValue').props().availableVariables).toStrictEqual(
        AVAILABLE_VARIABLES_SAMPLE,
      );
    });

    it('should use the date input', () => {
      createWrapper(mount);
      const widgetWrappers = wrapper.findAll('.filterValue');
      expect(widgetWrappers.at(0).classes()).toContain('widget-input-date__container');
    });

    it('should emit a new condition with the correct type of value when changing the operator', () => {
      createWrapper(shallowMount);
      const operatorWrapper = wrapper.findAll('autocompletewidget-stub').at(1);
      // eq operator
      operatorWrapper.vm.$emit('input', { operator: 'eq' });
      expect(wrapper.emitted().input[0]).toEqual([
        { column: 'columnA', value: new Date('2021-01-01'), operator: 'eq' },
      ]);
      // isnull operator
      operatorWrapper.vm.$emit('input', { operator: 'isnull' });
      expect(wrapper.emitted().input[1]).toEqual([
        { column: 'columnA', value: null, operator: 'isnull' },
      ]);
      // notnull operator
      operatorWrapper.vm.$emit('input', { operator: 'notnull' });
      expect(wrapper.emitted().input[2]).toEqual([
        { column: 'columnA', value: null, operator: 'notnull' },
      ]);
    });
    it('should transform invalid dates to valid date when changing the operator', () => {
      createWrapper(shallowMount, {
        value: { column: 'columnA', value: 1, operator: 'matches' },
      });
      const operatorWrapper = wrapper.findAll('autocompletewidget-stub').at(1);
      // eq operator
      operatorWrapper.vm.$emit('input', { operator: 'eq' });
      expect(wrapper.emitted().input[0]).toEqual([
        { column: 'columnA', value: null, operator: 'eq' },
      ]);
    });
    it('should transform invalid dates to valid date when changing the column type', async () => {
      createWrapper(shallowMount, {
        value: { column: 'columnA', value: new Date('2021-01-01'), operator: 'eq' },
      });
      wrapper.setProps({ columnTypes: { columnA: 'string' } });
      await wrapper.vm.$nextTick();
      // relaunch operator validation automatically when changing the column type
      expect(wrapper.emitted().input[0]).toEqual([
        { column: 'columnA', value: '', operator: 'eq' },
      ]);
    });
  });

  describe('date column and date (using an invalid operator)', () => {
    let wrapper: Wrapper<FilterSimpleConditionWidget>;
    const createWrapper = (operator: string, isRelativeDateEnabled = false) => {
      const store = setupMockStore({
        dataset: {
          headers: [{ name: 'columnA' }, { name: 'columnB' }, { name: 'columnC' }],
          data: [],
        },
        selectedColumns: ['columnA'],
        featureFlags: {
          RELATIVE_DATE_FILTERING: isRelativeDateEnabled ? 'enable' : 'disable',
        },
      });
      wrapper = shallowMount(FilterSimpleConditionWidget, {
        propsData: {
          value: { column: 'columnA', value: '', operator },
          columnTypes: { columnA: 'date' },
          availableVariables: AVAILABLE_VARIABLES_SAMPLE,
        },
        store,
        localVue,
        sync: false,
      });
    };

    it('should transform an invalid "from" operator when relative date are disabled', async () => {
      createWrapper('from');
      await wrapper.vm.$nextTick();
      expect(wrapper.emitted().input).toHaveLength(1);
      // should emit new value with 'ge' operator replacing invalid 'from' operator
      expect(wrapper.emitted().input[0]).toEqual([
        { column: 'columnA', value: '', operator: 'ge' },
      ]);
    });

    it('should transform an invalid "until" operator when relative date are disabled', async () => {
      createWrapper('until');
      await wrapper.vm.$nextTick();
      expect(wrapper.emitted().input).toHaveLength(1);
      // should emit new value with 'le' operator replacing invalid 'until' operator
      expect(wrapper.emitted().input[0]).toEqual([
        { column: 'columnA', value: '', operator: 'le' },
      ]);
    });

    it('should transform an invalid "le" operator when relative date are enabled', async () => {
      createWrapper('le', true);
      await wrapper.vm.$nextTick();
      expect(wrapper.emitted().input).toHaveLength(1);
      // should emit new value with 'until' operator replacing invalid 'le' operator
      expect(wrapper.emitted().input[0]).toEqual([
        { column: 'columnA', value: '', operator: 'until' },
      ]);
    });

    it('should transform an invalid "lt" operator when relative date are enabled', async () => {
      createWrapper('lt', true);
      await wrapper.vm.$nextTick();
      expect(wrapper.emitted().input).toHaveLength(1);
      // should emit new value with 'until' operator replacing invalid 'lt' operator
      expect(wrapper.emitted().input[0]).toEqual([
        { column: 'columnA', value: '', operator: 'until' },
      ]);
    });

    it('should transform an invalid "ge" operator when relative date are enabled', async () => {
      createWrapper('ge', true);
      await wrapper.vm.$nextTick();
      expect(wrapper.emitted().input).toHaveLength(1);
      // should emit new value with 'from' operator replacing invalid 'ge' operator
      expect(wrapper.emitted().input[0]).toEqual([
        { column: 'columnA', value: '', operator: 'from' },
      ]);
    });

    it('should transform an invalid "gt" operator when relative date are enabled', async () => {
      createWrapper('gt', true);
      await wrapper.vm.$nextTick();
      expect(wrapper.emitted().input).toHaveLength(1);
      // should emit new value with 'from' operator replacing invalid 'gt' operator
      expect(wrapper.emitted().input[0]).toEqual([
        { column: 'columnA', value: '', operator: 'from' },
      ]);
    });

    it('should fallback to first available operator when selected operator is invalid and relative date are enabled', async () => {
      createWrapper('eq', true);
      await wrapper.vm.$nextTick();
      expect(wrapper.emitted().input).toHaveLength(1);
      expect(wrapper.emitted().input[0]).toEqual([
        { column: 'columnA', value: '', operator: 'from' },
      ]);
    });

    it('should keep valid operator unchanged', async () => {
      createWrapper('isnull', true);
      await wrapper.vm.$nextTick();
      expect(wrapper.emitted().input).toBeUndefined();
    });
  });
});
