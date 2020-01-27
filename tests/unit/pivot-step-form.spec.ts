import PivotStepForm from '@/components/stepforms/PivotStepForm.vue';
import { VQBnamespace } from '@/store';

import { BasicStepFormTestRunner,setupMockStore } from './utils';

describe('Pivot Step Form', () => {
  const runner = new BasicStepFormTestRunner(PivotStepForm, 'pivot');
  runner.testInstantiate();
  runner.testExpectedComponents({
    'multiselectwidget-stub': 1,
    'columnpicker-stub': 1,
    'autocompletewidget-stub': 2,
  });
  runner.testValidate({
    testlabel: 'submitted data is valid',
    props: {
      initialStepValue: {
        name: 'pivot',
        index: ['columnA', 'columnB'],
        column_to_pivot: 'foo',
        value_column: 'bar',
        agg_function: 'sum',
      },
    },
  });
  runner.testValidationErrors([
    {
      testlabel: 'submitted data is not valid',
      errors: [
        { keyword: 'minLength', dataPath: '.column_to_pivot' },
        { keyword: 'minItems', dataPath: '.index' },
        { keyword: 'minLength', dataPath: '.value_column' },
      ],
    },
    {
      testlabel: 'index and column_to_pivot column names overlap',
      store: setupMockStore({
        dataset: {
          headers: [{ name: 'columnA' }, { name: 'columnB' }, { name: 'columnC' }],
          data: [],
        },
      }),
      data: {
        editedStep: {
          name: 'pivot',
          index: ['columnA', 'columnC'],
          column_to_pivot: 'columnA',
          value_column: 'columnB',
          agg_function: 'sum',
        },
      },
      errors: [
        {
          keyword: 'columnNameConflict',
          dataPath: '.column_to_pivot',
        },
      ],
    },
    {
      testlabel: 'index and value_column column names overlap',
      store: setupMockStore({
        dataset: {
          headers: [{ name: 'columnA' }, { name: 'columnB' }, { name: 'columnC' }],
          data: [],
        },
      }),
      data: {
        editedStep: {
          name: 'pivot',
          index: ['columnA', 'columnC'],
          column_to_pivot: 'columnB',
          value_column: 'columnA',
          agg_function: 'sum',
        },
      },
      errors: [
        {
          keyword: 'columnNameConflict',
          dataPath: '.value_column',
        },
      ],
    },
    {
      testlabel: 'column_to_pivot and value_column are equal',
      store: setupMockStore({
        dataset: {
          headers: [{ name: 'columnA' }, { name: 'columnB' }, { name: 'columnC' }],
          data: [],
        },
      }),
      data: {
        editedStep: {
          name: 'pivot',
          index: ['columnA', 'columnC'],
          column_to_pivot: 'columnB',
          value_column: 'columnB',
          agg_function: 'sum',
        },
      },
      errors: [
        {
          keyword: 'columnNameConflict',
          dataPath: '.column_to_pivot',
        },
      ],
    },
  ]);

  it('should pass down props to widgets', async () => {
    const wrapper = runner.shallowMount(undefined, {
      data: {
        editedStep: {
          name: 'pivot',
          index: ['label'],
          column_to_pivot: 'country',
          value_column: 'value',
          agg_function: 'sum',
        },
      },
    });
    await wrapper.vm.$nextTick();
    expect(wrapper.find('#indexInput').props('value')).toEqual(['label']);
    expect(wrapper.find('#valueColumnInput').props('value')).toEqual('value');
    expect(wrapper.find('#aggregationFunctionInput').props('value')).toEqual('sum');
  });

  it('should instantiate indexInput widget multiselect with column names', () => {
    const initialState = {
      dataset: {
        headers: [{ name: 'columnA' }, { name: 'columnB' }, { name: 'columnC' }],
        data: [],
      },
    };
    const wrapper = runner.shallowMount(initialState);
    expect(wrapper.find('#indexInput').attributes('options')).toEqual('columnA,columnB,columnC');
  });

  it('should instantiate valueColumnInput widget autocomplete with column names', () => {
    const initialState = {
      dataset: {
        headers: [{ name: 'columnA' }, { name: 'columnB' }, { name: 'columnC' }],
        data: [],
      },
    };
    const wrapper = runner.shallowMount(initialState);
    expect(wrapper.find('#valueColumnInput').attributes('options')).toEqual(
      'columnA,columnB,columnC',
    );
  });

  it('should instantiate aggregationFunctionInput widget autocomplete with the right aggregation function names', () => {
    const wrapper = runner.shallowMount();
    expect(wrapper.find('#aggregationFunctionInput').attributes('options')).toEqual(
      'sum,avg,count,min,max',
    );
  });

  it('should update step when selectedColumn is changed', async () => {
    const initialState = {
      dataset: {
        headers: [{ name: 'columnA' }, { name: 'columnB' }, { name: 'columnC' }],
        data: [],
      },
    };
    const wrapper = runner.shallowMount(initialState);
    expect(wrapper.vm.$data.editedStep.column_to_pivot).toEqual('');
    wrapper.vm.$store.commit(VQBnamespace('toggleColumnSelection'), { column: 'columnB' });
    await wrapper.vm.$nextTick();
    expect(wrapper.vm.$data.editedStep.column_to_pivot).toEqual('columnB');
  });
});
