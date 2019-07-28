import { mount, shallowMount, createLocalVue } from '@vue/test-utils';
import PivotStepForm from '@/components/stepforms/PivotStepForm.vue';
import Vuex, { Store } from 'vuex';
import { setupStore } from '@/store';
import { VQBState } from '@/store/state';

const localVue = createLocalVue();
localVue.use(Vuex);

interface ValidationError {
  dataPath: string;
  keyword: string;
  message: string;
}

describe('Pivot Step Form', () => {
  let emptyStore: Store<VQBState>;
  beforeEach(() => {
    emptyStore = setupStore({});
  });

  it('should instantiate', () => {
    const wrapper = shallowMount(PivotStepForm, { store: emptyStore, localVue });
    expect(wrapper.exists()).toBeTruthy();
  });

  it('should have 4 input components', () => {
    const wrapper = shallowMount(PivotStepForm, { store: emptyStore, localVue });
    const multiselectWrappers = wrapper.findAll('multiselectwidget-stub');
    const columnpickerWrappers = wrapper.findAll('columnpicker-stub');
    const autocompleteWrappers = wrapper.findAll('autocompletewidget-stub');
    expect(multiselectWrappers.length).toEqual(1);
    expect(columnpickerWrappers.length).toEqual(1);
    expect(autocompleteWrappers.length).toEqual(2);
  });

  it('should pass down props to widgets', () => {
    const wrapper = shallowMount(PivotStepForm, {
      store: emptyStore,
      localVue,
      data: () => {
        return {
          editedStep: {
            name: 'pivot',
            index: ['label'],
            column_to_pivot: 'country',
            value_column: 'value',
            agg_function: 'sum',
          },
        };
      },
    });
    expect(wrapper.find('#indexInput').props('value')).toEqual(['label']);
    expect(wrapper.find('#valueColumnInput').props('value')).toEqual('value');
    expect(wrapper.find('#aggregationFunctionInput').props('value')).toEqual('sum');
  });

  it('should instantiate indexInput widget multiselect with column names', () => {
    const store = setupStore({
      dataset: {
        headers: [{ name: 'columnA' }, { name: 'columnB' }, { name: 'columnC' }],
        data: [],
      },
    });
    const wrapper = shallowMount(PivotStepForm, { store, localVue });
    expect(wrapper.find('#indexInput').attributes('options')).toEqual('columnA,columnB,columnC');
  });

  it('should instantiate valueColumnInput widget autocomplete with column names', () => {
    const store = setupStore({
      dataset: {
        headers: [{ name: 'columnA' }, { name: 'columnB' }, { name: 'columnC' }],
        data: [],
      },
    });
    const wrapper = shallowMount(PivotStepForm, { store, localVue });
    expect(wrapper.find('#valueColumnInput').attributes('options')).toEqual(
      'columnA,columnB,columnC',
    );
  });

  it('should instantiate aggregationFunctionInput widget autocomplete with the right aggregation function names', () => {
    const wrapper = shallowMount(PivotStepForm, { store: emptyStore, localVue });
    expect(wrapper.find('#aggregationFunctionInput').attributes('options')).toEqual(
      'sum,avg,count,min,max',
    );
  });

  it('should validate and emit "formSaved" when submitted data is valid', async () => {
    const wrapper = mount(PivotStepForm, {
      store: emptyStore,
      localVue,
      propsData: {
        initialStepValue: {
          name: 'pivot',
          index: ['columnA', 'columnB'],
          column_to_pivot: 'foo',
          value_column: 'bar',
          agg_function: 'sum',
        },
      },
    });
    wrapper.find('.widget-form-action__button--validate').trigger('click');
    await localVue.nextTick();
    expect(wrapper.vm.$data.errors).toBeNull();
    expect(wrapper.emitted()).toEqual({
      formSaved: [
        [
          {
            name: 'pivot',
            index: ['columnA', 'columnB'],
            column_to_pivot: 'foo',
            value_column: 'bar',
            agg_function: 'sum',
          },
        ],
      ],
    });
  });

  describe('Errors', () => {
    it('should fire errors when fields are missing', () => {
      const wrapper = mount(PivotStepForm, { store: emptyStore, localVue });

      wrapper.find('.widget-form-action__button--validate').trigger('click');
      const errors = wrapper.vm.$data.errors
        .map((err: ValidationError) => ({ keyword: err.keyword, dataPath: err.dataPath }))
        .sort((err1: ValidationError, err2: ValidationError) =>
          err1.dataPath.localeCompare(err2.dataPath),
        );

      expect(errors).toEqual([
        { keyword: 'minLength', dataPath: '.column_to_pivot' },
        { keyword: 'minItems', dataPath: '.index' },
        { keyword: 'minLength', dataPath: '.value_column' },
      ]);
    });

    it('should fire errors when index and column_to_pivot column names overlap', async () => {
      const store = setupStore({
        dataset: {
          headers: [{ name: 'columnA' }, { name: 'columnB' }, { name: 'columnC' }],
          data: [],
        },
      });
      const wrapper = mount(PivotStepForm, { store, localVue });
      wrapper.setData({
        editedStep: {
          name: 'pivot',
          index: ['columnA', 'columnC'],
          column_to_pivot: 'columnA',
          value_column: 'columnB',
          agg_function: 'sum',
        },
      });
      wrapper.find('.widget-form-action__button--validate').trigger('click');
      await localVue.nextTick();
      const errors = wrapper.vm.$data.errors.map((err: ValidationError) => ({
        keyword: err.keyword,
        dataPath: err.dataPath,
        message: err.message,
      }));
      expect(errors).toEqual([
        {
          keyword: 'columnNameConflict',
          dataPath: '.column_to_pivot',
          message: 'Column name columnA is used at least twice but should be unique',
        },
      ]);
    });

    it('should fire errors when index and value_column column names overlap', async () => {
      const store = setupStore({
        dataset: {
          headers: [{ name: 'columnA' }, { name: 'columnB' }, { name: 'columnC' }],
          data: [],
        },
      });
      const wrapper = mount(PivotStepForm, { store, localVue });
      wrapper.setData({
        editedStep: {
          name: 'pivot',
          index: ['columnA', 'columnC'],
          column_to_pivot: 'columnB',
          value_column: 'columnA',
          agg_function: 'sum',
        },
      });
      wrapper.find('.widget-form-action__button--validate').trigger('click');
      await localVue.nextTick();
      const errors = wrapper.vm.$data.errors.map((err: ValidationError) => ({
        keyword: err.keyword,
        dataPath: err.dataPath,
        message: err.message,
      }));
      expect(errors).toEqual([
        {
          keyword: 'columnNameConflict',
          dataPath: '.value_column',
          message: 'Column name columnA is used at least twice but should be unique',
        },
      ]);
    });

    it('should fire errors when column_to_pivot and value_column are equal', async () => {
      const store = setupStore({
        dataset: {
          headers: [{ name: 'columnA' }, { name: 'columnB' }, { name: 'columnC' }],
          data: [],
        },
      });
      const wrapper = mount(PivotStepForm, { store, localVue });
      wrapper.setData({
        editedStep: {
          name: 'pivot',
          index: ['columnA', 'columnC'],
          column_to_pivot: 'columnB',
          value_column: 'columnB',
          agg_function: 'sum',
        },
      });
      wrapper.find('.widget-form-action__button--validate').trigger('click');
      await localVue.nextTick();
      const errors = wrapper.vm.$data.errors.map((err: ValidationError) => ({
        keyword: err.keyword,
        dataPath: err.dataPath,
        message: err.message,
      }));
      expect(errors).toEqual([
        {
          keyword: 'columnNameConflict',
          dataPath: '.column_to_pivot',
          message: 'Column name columnB is used at least twice but should be unique',
        },
      ]);
    });
  });
});
