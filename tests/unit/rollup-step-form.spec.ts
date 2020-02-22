import RollupStepForm from '@/components/stepforms/RollupStepForm.vue';
import AutocompleteWidget from '@/components/stepforms/widgets/Autocomplete.vue';

import { BasicStepFormTestRunner } from './utils';

describe('Rollup Step Form', () => {
  const runner = new BasicStepFormTestRunner(RollupStepForm, 'rollup');
  runner.testInstantiate();
  runner.testExpectedComponents({
    'multiselectwidget-stub': 2,
    'inputtextwidget-stub': 3,
  });

  describe('MultiselectWidgets', () => {
    it('should instantiate a MultiselectWidget widget with proper options from the store', () => {
      const initialState = {
        dataset: {
          headers: [{ name: 'columnA' }, { name: 'columnB' }, { name: 'columnC' }],
          data: [],
        },
      };
      const wrapper = runner.shallowMount(initialState);
      const widgetMultiselects = wrapper.findAll('multiselectwidget-stub');
      expect(widgetMultiselects.at(0).attributes('options')).toEqual('columnA,columnB,columnC');
      expect(widgetMultiselects.at(1).attributes('options')).toEqual('columnA,columnB,columnC');
    });

    it('should pass down the props to the MultiselectWidget value prop', async () => {
      const wrapper = runner.shallowMount(undefined, {
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

    it('should call the setColumnMutation on input', async () => {
      const wrapper = runner.mount(undefined, {
        data: { editedStep: { name: 'rollup', hierarchy: ['foo'], aggregations: [] } },
      });
      await wrapper.vm.$nextTick();
      expect(wrapper.vm.$store.state.vqb.selectedColumns).toEqual(['foo']);
      wrapper.setData({ editedStep: { name: 'rollup', on: ['foo'], groupby: ['bar'] } });
      await wrapper.vm.$nextTick();
      expect(wrapper.vm.$store.state.vqb.selectedColumns).toEqual(['bar']);
    });
  });

  describe('ListWidget', () => {
    it('should have exactly on ListWidget component', () => {
      const wrapper = runner.shallowMount();
      const widgetWrappers = wrapper.findAll('listwidget-stub');
      expect(widgetWrappers.length).toEqual(1);
    });

    it('should pass down the "aggregations" prop to the ListWidget value prop', async () => {
      const wrapper = runner.shallowMount(undefined, {
        data: {
          editedStep: {
            name: 'rollup',
            hierarchy: [],
            aggregations: [{ column: 'foo', newcolumn: 'bar', aggfunction: 'sum' }],
          },
        },
      });
      await wrapper.vm.$nextTick();
      expect(wrapper.find('listwidget-stub').props().value).toEqual([
        { column: 'foo', newcolumn: 'bar', aggfunction: 'sum' },
      ]);
    });

    it('should have expected default aggregation parameters', () => {
      const wrapper = runner.mount();
      const widgetWrappers = wrapper.findAll(AutocompleteWidget);
      expect(widgetWrappers.at(0).props().value).toEqual('');
      expect(widgetWrappers.at(1).props().value).toEqual('sum');
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
                newcolumn: 'sum_col1',
                aggfunction: 'sum',
                column: 'col1',
              },
            ],
          },
        },
        errors: [{ keyword: 'minLength', dataPath: '.hierarchy[0]' }],
      },
      {
        testlabel: '"groupby" parameter is an empty string',
        props: {
          initialStepValue: {
            name: 'rollup',
            hierarchy: ['foo'],
            aggregations: [
              {
                newcolumn: 'sum_col1',
                aggfunction: 'sum',
                column: 'col1',
              },
            ],
            groupby: [''],
          },
        },
        errors: [{ keyword: 'minLength', dataPath: '.groupby[0]' }],
      },
      {
        testlabel: '"column" parameter is an empty string',
        props: {
          initialStepValue: {
            name: 'rollup',
            hierarchy: ['column1'],
            aggregations: [
              {
                newcolumn: '',
                aggfunction: 'sum',
                column: '',
              },
            ],
          },
        },
        errors: [
          { keyword: 'minLength', dataPath: '.aggregations[0].column' },
          // newcolumn is computed based on column so an error is also returned for this parameter
          { keyword: 'minLength', dataPath: '.aggregations[0].newcolumn' },
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
                newcolumn: 'foo_col1',
                aggfunction: 'foo',
                column: 'col1',
              },
            ],
          },
        },
        errors: [{ keyword: 'enum', dataPath: '.aggregations[0].aggfunction' }],
      },
      {
        testlabel: '"labelCol" parameter is an empty string',
        props: {
          initialStepValue: {
            name: 'rollup',
            hierarchy: ['column1'],
            aggregations: [
              {
                newcolumn: 'sum_col1',
                aggfunction: 'sum',
                column: 'col1',
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
                newcolumn: 'sum_col1',
                aggfunction: 'sum',
                column: 'col1',
              },
            ],
            levelCol: '',
          },
        },
        errors: [{ keyword: 'minLength', dataPath: '.levelCol' }],
      },
      {
        testlabel: '"parentLabelCol" parameter is an empty string',
        props: {
          initialStepValue: {
            name: 'rollup',
            hierarchy: ['column1'],
            aggregations: [
              {
                newcolumn: 'sum_col1',
                aggfunction: 'sum',
                column: 'col1',
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
          aggregations: [{ column: 'bar', newcolumn: 'bar', aggfunction: 'sum' }],
          labelCol: 'label',
          levelCol: 'label',
          parentLabelCol: 'label',
        },
      },
    });

    it('should keep the same column name as newcolumn if only one aggregation is performed', () => {
      const wrapper = runner.mount(undefined, {
        data: {
          editedStep: {
            name: 'rollup',
            hierarchy: ['foo'],
            aggregations: [{ column: 'bar', newcolumn: '', aggfunction: 'sum' }],
          },
        },
      });
      wrapper.find('.widget-form-action__button--validate').trigger('click');
      expect(wrapper.vm.$data.errors).toBeNull();
      expect(wrapper.vm.$data.editedStep.aggregations[0].newcolumn).toEqual('bar');
    });

    it('should set newcolumn cleverly if several aggregations are performed o, the same column', () => {
      const wrapper = runner.mount(undefined, {
        data: {
          editedStep: {
            name: 'rollup',
            hierarchy: ['foo'],
            aggregations: [
              { column: 'bar', newcolumn: '', aggfunction: 'sum' },
              { column: 'bar', newcolumn: '', aggfunction: 'avg' },
            ],
          },
        },
      });
      wrapper.find('.widget-form-action__button--validate').trigger('click');
      expect(wrapper.vm.$data.errors).toBeNull();
      expect(wrapper.vm.$data.editedStep.aggregations[0].newcolumn).toEqual('bar-sum');
      expect(wrapper.vm.$data.editedStep.aggregations[1].newcolumn).toEqual('bar-avg');
    });
  });

  runner.testCancel();
  runner.testResetSelectedIndex();
});
