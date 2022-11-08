import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/helpers');

import AddTotalRowsStepForm from '@/components/stepforms/AddTotalRowsStepForm.vue';
import AutocompleteWidget from '@/components/stepforms/widgets/Autocomplete.vue';
import InputTextWidget from '@/components/stepforms/widgets/InputText.vue';
import MultiselectWidget from '@/components/stepforms/widgets/Multiselect.vue';
import { setAggregationsNewColumnsInStep } from '@/lib/helpers';

import { BasicStepFormTestRunner } from './utils';

vi.mock('@/components/FAIcon.vue');

describe('Add Total Rows Step Form', () => {
  const runner = new BasicStepFormTestRunner(AddTotalRowsStepForm, 'totals');
  runner.testInstantiate();
  runner.testExpectedComponents({
    'listwidget-stub': 2,
    'multiselectwidget-stub': 1,
  });

  runner.testCancel();
  runner.testResetSelectedIndex();

  describe('ListWidget "totalDimensions"', () => {
    it('should pass down the "totalDimensions" prop to the first ListWidget value prop', async () => {
      const wrapper = runner.shallowMount(undefined, {
        data: {
          editedStep: {
            name: 'totals',
            totalDimensions: [{ totalColumn: 'foo', totalRowsLabel: 'bar' }],
            aggregations: [],
          },
        },
      });
      await wrapper.vm.$nextTick();
      expect(wrapper.findAll('listwidget-stub').at(0).props().value).toEqual([
        { totalColumn: 'foo', totalRowsLabel: 'bar' },
      ]);
    });

    it('should get the right data "totalDimensions" when editedStep.totals is empty', async () => {
      const wrapper = runner.shallowMount(undefined, {
        data: {
          editedStep: {
            name: 'totals',
            totalDimensions: [],
            aggregations: [],
          },
        },
      });
      await wrapper.vm.$nextTick();
      expect(wrapper.findAll('listwidget-stub').at(0).props().value).toEqual([
        { totalColumn: '', totalRowsLabel: '' },
      ]);
    });

    it('should update the edited step when one of the subcomponents emits an updated value', () => {
      const wrapper = runner.shallowMount(undefined, {
        data: {
          editedStep: {
            name: 'totals',
            totalDimensions: [],
            aggregations: [],
          },
        },
      });
      wrapper
        .findAll('listwidget-stub')
        .at(0)
        .vm.$emit('input', [{ totalColumn: 'foo', totalRowsLabel: 'bar' }]);
      expect(wrapper.vm.$data.editedStep.totalDimensions).toEqual([
        { totalColumn: 'foo', totalRowsLabel: 'bar' },
      ]);
    });

    it('should have expected default totalDimensions', () => {
      const wrapper = runner.mount();
      const autocompleteWrapper = wrapper.find(AutocompleteWidget);
      const inputTextWrapper = wrapper.find(InputTextWidget);
      expect(autocompleteWrapper.props().value).toEqual('');
      expect(inputTextWrapper.props().value).toEqual('');
    });
  });

  describe('ListWidget "aggregations"', () => {
    it('should pass down the "aggregations" prop to the ListWidget value prop', async () => {
      const wrapper = runner.shallowMount(undefined, {
        data: {
          editedStep: {
            name: 'totals',
            totalDimensions: [],
            aggregations: [{ column: 'foo', newcolumn: 'bar', aggfunction: 'sum' }],
          },
        },
      });
      await wrapper.vm.$nextTick();
      expect(wrapper.findAll('listwidget-stub').at(1).props().value).toEqual([
        { column: 'foo', newcolumn: 'bar', aggfunction: 'sum' },
      ]);
    });

    it('should have expected default aggregation parameters', () => {
      const wrapper = runner.mount();
      const autocompleteWrapper = wrapper.findAll(AutocompleteWidget);
      const multiselectWrappers = wrapper.findAll(MultiselectWidget);
      expect(autocompleteWrapper.at(1).props().value).toEqual('sum');
      expect(multiselectWrappers.at(0).props().value).toEqual([]);
    });
  });

  describe('MultiselectWidget', () => {
    it('should instantiate an MultiselectWidget widget with proper options from the store', () => {
      const initialState = {
        dataset: {
          headers: [{ name: 'columnA' }, { name: 'columnB' }, { name: 'columnC' }],
          data: [],
        },
      };
      const wrapper = runner.shallowMount(initialState);
      const widgetMultiselect = wrapper.find('multiselectwidget-stub');
      expect(widgetMultiselect.attributes('options')).toEqual('columnA,columnB,columnC');
    });

    it('should pass down the "groups" prop to the MultiselectWidget value prop', async () => {
      const wrapper = runner.shallowMount(undefined, {
        data: {
          editedStep: {
            name: 'totals',
            totalDimensions: [],
            aggregations: [],
            groups: ['foo', 'bar'],
          },
        },
      });
      await wrapper.vm.$nextTick();
      expect(wrapper.find('multiselectwidget-stub').props().value).toEqual(['foo', 'bar']);
    });
  });

  describe('Validation', () => {
    runner.testValidationErrors([
      {
        testlabel: '"totals" parameter includes a empty strings',
        props: {
          initialStepValue: {
            name: 'totals',
            totalDimensions: [{ totalColumn: '', totalRowsLabel: '' }],
            aggregations: [
              {
                newcolumns: ['foo'],
                aggfunction: 'sum',
                columns: ['bar'],
              },
            ],
          },
        },
        errors: [
          { keyword: 'minLength', dataPath: '.totalDimensions.0.totalColumn' },
          { keyword: 'minLength', dataPath: '.totalDimensions.0.totalRowsLabel' },
        ],
      },
      {
        testlabel: '"aggragations" parameter includes a empty strings',
        props: {
          initialStepValue: {
            name: 'totals',
            totalDimensions: [{ totalColumn: 'foo', totalRowsLabel: 'bar' }],
            aggregations: [
              {
                newcolumns: [''],
                aggfunction: 'sum',
                columns: [''],
              },
            ],
          },
        },
        errors: [
          { keyword: 'minLength', dataPath: '.aggregations.0.columns.0' },
          { keyword: 'minLength', dataPath: '.aggregations.0.newcolumns.0' },
        ],
      },
      {
        testlabel: '"aggfunction" unknown',
        props: {
          initialStepValue: {
            name: 'totals',
            totalDimensions: [{ totalColumn: 'foo', totalRowsLabel: 'bar' }],
            aggregations: [
              {
                newcolumns: ['foo'],
                aggfunction: 'unknwon',
                columns: ['bar'],
              },
            ],
          },
        },
        errors: [{ keyword: 'enum', dataPath: '.aggregations.0.aggfunction' }],
      },
      {
        testlabel: '"groups" parameter includes an empty string',
        props: {
          initialStepValue: {
            name: 'totals',
            totalDimensions: [{ totalColumn: 'foo', totalRowsLabel: 'bar' }],
            aggregations: [
              {
                newcolumns: ['foo'],
                aggfunction: 'sum',
                columns: ['bar'],
              },
            ],
            groups: [''],
          },
        },
        errors: [{ keyword: 'minLength', dataPath: '.groups.0' }],
      },
    ]);

    runner.testValidate({
      testlabel: 'submitted data is valid',
      props: {
        initialStepValue: {
          name: 'totals',
          totalDimensions: [{ totalColumn: 'foo', totalRowsLabel: 'bar' }],
          aggregations: [
            {
              newcolumns: ['foo'],
              aggfunction: 'sum',
              columns: ['bar'],
            },
          ],
        },
      },
    });
  });

  it('should call teh setAggregationsNewColumnsInStep function with editedStep as input', () => {
    const editedStep = {
      name: 'totals',
      totalDimensions: [{ totalColumn: 'foo', totalRowsLabel: 'bar' }],
      aggregations: [
        { columns: ['bar', 'test'], newcolumns: ['', ''], aggfunction: 'sum' },
        { columns: ['bar', 'test'], newcolumns: ['', ''], aggfunction: 'avg' },
      ],
    };
    const wrapper = runner.mount(undefined, { data: { editedStep } });
    wrapper.find('.widget-form-action__button--validate').trigger('click');
    expect(setAggregationsNewColumnsInStep).toHaveBeenCalled();
    expect(setAggregationsNewColumnsInStep).toHaveBeenCalledWith(editedStep);
  });
});
