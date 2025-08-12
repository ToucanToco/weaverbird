import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/helpers');

import RollupStepForm from '@/components/stepforms/RollupStepForm.vue';
import AutocompleteWidget from '@/components/stepforms/widgets/Autocomplete.vue';
import MultiselectWidget from '@/components/stepforms/widgets/Multiselect.vue';
import { setAggregationsNewColumnsInStep } from '@/lib/helpers';

import { BasicStepFormTestRunner } from './utils';

vi.mock('@/components/FAIcon.vue');

describe('Rollup Step Form', () => {
  const runner = new BasicStepFormTestRunner(RollupStepForm, 'rollup');
  runner.testInstantiate();
  runner.testExpectedComponents({
    'multiselectwidget-stub': 2,
    'inputtextwidget-stub': 3,
  });

  describe('MultiselectWidgets', () => {
    it('should instantiate a MultiselectWidget widget with proper options from the store', () => {
      const wrapper = runner.shallowMount({
        propsData: {
          columnTypes: { columnA: 'string', columnB: 'string', columnC: 'string' },
        },
      });
      const widgetMultiselects = wrapper.findAll('multiselectwidget-stub');
      expect(widgetMultiselects.at(0).attributes('options')).toEqual('columnA,columnB,columnC');
      expect(widgetMultiselects.at(1).attributes('options')).toEqual('columnA,columnB,columnC');
    });

    it('should pass down the props to the MultiselectWidget value prop', async () => {
      const wrapper = runner.shallowMount({
        data: {
          editedStep: {
            name: 'rollup',
            hierarchy: ['foo', 'bar'],
            aggregations: [],
            groupby: ['test'],
          },
        },
      });
      await wrapper.vm.$nextTick();
      const widgetMultiselects = wrapper.findAll('multiselectwidget-stub');
      expect(widgetMultiselects.at(0).props().value).toEqual(['foo', 'bar']);
      expect(widgetMultiselects.at(1).props().value).toEqual(['test']);
    });
  });

  describe('ListWidget', () => {
    it('should have exactly one ListWidget component', () => {
      const wrapper = runner.shallowMount();
      const widgetWrappers = wrapper.findAll('listwidget-stub');
      expect(widgetWrappers.length).toEqual(1);
    });

    it('should pass down the "aggregations" prop to the ListWidget value prop', async () => {
      const wrapper = runner.shallowMount({
        data: {
          editedStep: {
            name: 'rollup',
            hierarchy: [],
            aggregations: [{ columns: ['foo'], newcolumns: ['bar'], aggfunction: 'sum' }],
          },
        },
      });
      await wrapper.vm.$nextTick();
      expect(wrapper.find('listwidget-stub').props().value).toEqual([
        { columns: ['foo'], newcolumns: ['bar'], aggfunction: 'sum' },
      ]);
    });

    it('should have no default aggregation', () => {
      const wrapper = runner.mount();
      const autocompleteWrappers = wrapper.find('.aggregationsInput').findAll(AutocompleteWidget);
      const multiselectWrappers = wrapper.find('.aggregationsInput').findAll(MultiselectWidget);
      expect(autocompleteWrappers.length).toEqual(0);
      expect(multiselectWrappers.length).toEqual(0);
    });

    it('should have expected default aggregation parameters', async () => {
      const wrapper = runner.mount();
      await wrapper.find('.widget-list__add-fieldset').trigger('click');
      const autocompleteWrappers = wrapper.find('.aggregationsInput').findAll(AutocompleteWidget);
      const multiselectWrappers = wrapper.find('.aggregationsInput').findAll(MultiselectWidget);
      expect(autocompleteWrappers.length).toEqual(1);
      expect(multiselectWrappers.length).toEqual(1);
      expect(autocompleteWrappers.at(0).props().value).toEqual('sum');
      expect(multiselectWrappers.at(0).props().value).toEqual([]);
    });
  });

  describe('Validation', () => {
    runner.testValidationErrors([
      {
        testlabel: '"hierarchy" parameter is an empty string',
        props: {
          initialStepValue: {
            name: 'rollup',
            hierarchy: [''],
            aggregations: [
              {
                newcolumns: ['sum_col1'],
                aggfunction: 'sum',
                columns: ['col1'],
              },
            ],
          },
        },
        errors: [{ keyword: 'minLength', dataPath: '.hierarchy.0' }],
      },
      {
        testlabel: '"groupby" parameter is an empty string',
        props: {
          initialStepValue: {
            name: 'rollup',
            hierarchy: ['foo'],
            aggregations: [
              {
                newcolumns: ['sum_col1'],
                aggfunction: 'sum',
                columns: ['col1'],
              },
            ],
            groupby: [''],
          },
        },
        errors: [{ keyword: 'minLength', dataPath: '.groupby.0' }],
      },
      {
        testlabel: '"columns", "newcolumns" and "aggfunction" parameters include empty strings',
        props: {
          initialStepValue: {
            name: 'rollup',
            hierarchy: ['column1'],
            aggregations: [
              {
                aggfunction: '',
                columns: [''],
                newcolumns: [''],
              },
            ],
          },
        },
        errors: [
          { keyword: 'enum', dataPath: '.aggregations.0.aggfunction' },
          { keyword: 'minLength', dataPath: '.aggregations.0.columns.0' },
          { keyword: 'minLength', dataPath: '.aggregations.0.newcolumns.0' },
        ],
      },
      {
        testlabel: '"aggfunction" unknown',
        props: {
          initialStepValue: {
            name: 'rollup',
            hierarchy: ['column1'],
            aggregations: [
              {
                newcolumns: ['foo_col1'],
                aggfunction: 'foo',
                columns: ['col1'],
              },
            ],
          },
        },
        errors: [{ keyword: 'enum', dataPath: '.aggregations.0.aggfunction' }],
      },
      {
        testlabel: '"labelCol" parameter is an empty string',
        props: {
          initialStepValue: {
            name: 'rollup',
            hierarchy: ['column1'],
            aggregations: [
              {
                newcolumns: ['sum_col1'],
                aggfunction: 'sum',
                columns: ['col1'],
              },
            ],
            labelCol: '',
          },
        },
        errors: [{ keyword: 'minLength', dataPath: '.labelCol' }],
      },
      {
        testlabel: '"levelCol" parameter is an empty string',
        props: {
          initialStepValue: {
            name: 'rollup',
            hierarchy: ['column1'],
            aggregations: [
              {
                newcolumns: ['sum_col1'],
                aggfunction: 'sum',
                columns: ['col1'],
              },
            ],
            levelCol: '',
          },
        },
        errors: [{ keyword: 'minLength', dataPath: '.levelCol' }],
      },
      {
        testlabel: '"childLevelCol" parameter is an empty string',
        props: {
          initialStepValue: {
            name: 'rollup',
            hierarchy: ['column1'],
            aggregations: [
              {
                newcolumns: ['sum_col1'],
                aggfunction: 'sum',
                columns: ['col1'],
              },
            ],
            childLevelCol: '',
          },
        },
        errors: [{ keyword: 'minLength', dataPath: '.childLevelCol' }],
      },
      {
        testlabel: '"parentLabelCol" parameter is an empty string',
        props: {
          initialStepValue: {
            name: 'rollup',
            hierarchy: ['column1'],
            aggregations: [
              {
                newcolumns: ['sum_col1'],
                aggfunction: 'sum',
                columns: ['col1'],
              },
            ],
            parentLabelCol: '',
          },
        },
        errors: [{ keyword: 'minLength', dataPath: '.parentLabelCol' }],
      },
    ]);

    runner.testValidate({
      testlabel: 'submitted data is valid',
      props: {
        initialStepValue: {
          name: 'rollup',
          hierarchy: ['foo'],
          aggregations: [{ columns: ['bar'], newcolumns: ['bar'], aggfunction: 'sum' }],
          labelCol: 'label',
          levelCol: 'label',
          childLevelCol: 'child_label',
          parentLabelCol: 'label',
        },
      },
    });

    runner.testValidate({
      testlabel: 'submitted data is valid without aggregation',
      props: {
        initialStepValue: {
          name: 'rollup',
          hierarchy: ['foo'],
          aggregations: [],
          labelCol: 'label',
          levelCol: 'label',
          parentLabelCol: 'label',
        },
      },
    });

    it('should call the setAggregationsNewColumnsInStep function with editedStep as input', () => {
      const editedStep = {
        name: 'rollup',
        hierarchy: ['foo'],
        aggregations: [
          { columns: ['bar', 'test'], newcolumns: [''], aggfunction: 'sum' },
          { columns: ['bar', 'test'], newcolumns: [''], aggfunction: 'avg' },
        ],
      };
      const wrapper = runner.mount({ data: { editedStep } });
      wrapper.find('.widget-form-action__button--validate').trigger('click');
      expect(setAggregationsNewColumnsInStep).toHaveBeenCalled();
      expect(setAggregationsNewColumnsInStep).toHaveBeenCalledWith(editedStep);
    });
  });

  runner.testCancel();

  it('should convert editedStep from old configurations to new configuration', async () => {
    const wrapper = runner.shallowMount({
      propsData: {
        initialStepValue: {
          name: 'rollup',
          hierarchy: ['foo'],
          aggregations: [
            { column: 'foo', newcolumn: 'foo', aggregation: 'sum' },
            { column: 'bar', newcolumn: 'bar', aggregation: 'sum' },
            { columns: ['foo', 'bar'], newcolumns: ['foo', 'bar'], aggregation: 'sum' },
          ],
        },
      },
    });
    await wrapper.vm.$nextTick();
    expect(wrapper.vm.$data.editedStep.aggregations).toEqual([
      { columns: ['foo'], newcolumns: ['foo'], aggregation: 'sum' },
      { columns: ['bar'], newcolumns: ['bar'], aggregation: 'sum' },
      { columns: ['foo', 'bar'], newcolumns: ['foo', 'bar'], aggregation: 'sum' },
    ]);
  });
});
