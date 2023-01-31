import { describe, expect, it, vi } from 'vitest';

import PivotStepForm from '@/components/stepforms/PivotStepForm.vue';

import { BasicStepFormTestRunner, setupMockStore } from './utils';

vi.mock('@/components/FAIcon.vue');

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
        columnToPivot: 'foo',
        valueColumn: 'bar',
        aggFunction: 'sum',
      },
    },
  });
  runner.testValidationErrors([
    {
      testlabel: 'submitted data is not valid',
      errors: [
        { keyword: 'minLength', dataPath: '.columnToPivot' },
        { keyword: 'minLength', dataPath: '.valueColumn' },
      ],
    },
    {
      testlabel: 'index and columnToPivot column names overlap',
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
          columnToPivot: 'columnA',
          valueColumn: 'columnB',
          aggFunction: 'sum',
        },
      },
      errors: [
        {
          keyword: 'columnNameConflict',
          dataPath: '.columnToPivot',
        },
      ],
    },
    {
      testlabel: 'index and valueColumn column names overlap',
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
          columnToPivot: 'columnB',
          valueColumn: 'columnA',
          aggFunction: 'sum',
        },
      },
      errors: [
        {
          keyword: 'columnNameConflict',
          dataPath: '.valueColumn',
        },
      ],
    },
    {
      testlabel: 'columnToPivot and valueColumn are equal',
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
          columnToPivot: 'columnB',
          valueColumn: 'columnB',
          aggFunction: 'sum',
        },
      },
      errors: [
        {
          keyword: 'columnNameConflict',
          dataPath: '.columnToPivot',
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
          columnToPivot: 'country',
          valueColumn: 'value',
          aggFunction: 'sum',
        },
      },
    });
    await wrapper.vm.$nextTick();
    expect(wrapper.find('.indexInput').props('value')).toEqual(['label']);
    expect(wrapper.find('.valueColumnInput').props('value')).toEqual('value');
    expect(wrapper.find('.aggregationFunctionInput').props('value')).toEqual('sum');
  });

  it('should instantiate indexInput widget multiselect with column names', () => {
    const initialState = {
      dataset: {
        headers: [{ name: 'columnA' }, { name: 'columnB' }, { name: 'columnC' }],
        data: [],
      },
    };
    const wrapper = runner.shallowMount(initialState);
    expect(wrapper.find('.indexInput').attributes('options')).toEqual('columnA,columnB,columnC');
  });

  it('should instantiate valueColumnInput widget autocomplete with column names', () => {
    const initialState = {
      dataset: {
        headers: [{ name: 'columnA' }, { name: 'columnB' }, { name: 'columnC' }],
        data: [],
      },
    };
    const wrapper = runner.shallowMount(initialState);
    expect(wrapper.find('.valueColumnInput').attributes('options')).toEqual(
      'columnA,columnB,columnC',
    );
  });

  it('should instantiate aggregationFunctionInput widget autocomplete with the right aggregation function names', () => {
    const wrapper = runner.shallowMount();
    expect(wrapper.find('.aggregationFunctionInput').attributes('options')).toEqual(
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
    const store = runner.getStore();
    expect(wrapper.vm.$data.editedStep.columnToPivot).toEqual('');
    store.toggleColumnSelection({ column: 'columnB' });
    await wrapper.vm.$nextTick();
    expect(wrapper.vm.$data.editedStep.columnToPivot).toEqual('columnB');
  });
});
