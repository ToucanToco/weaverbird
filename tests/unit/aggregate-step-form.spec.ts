import AggregateStepForm from '@/components/stepforms/AggregateStepForm.vue';
import AutocompleteWidget from '@/components/stepforms/widgets/Autocomplete.vue';
import MultiselectWidget from '@/components/stepforms/widgets/Multiselect.vue';

import { BasicStepFormTestRunner } from './utils';

describe('Aggregate Step Form', () => {
  const runner = new BasicStepFormTestRunner(AggregateStepForm, 'aggregate');
  runner.testInstantiate();
  runner.testExpectedComponents({
    'multiselectwidget-stub': 1,
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

    it('should pass down the "on" prop to the MultiselectWidget value prop', async () => {
      const wrapper = runner.shallowMount(undefined, {
        data: { editedStep: { name: 'aggregate', on: ['foo', 'bar'], aggregations: [] } },
      });
      await wrapper.vm.$nextTick();
      expect(wrapper.find('multiselectwidget-stub').props().value).toEqual(['foo', 'bar']);
    });

    it('should call the setColumnMutation on input', async () => {
      const wrapper = runner.mount(undefined, {
        data: { editedStep: { name: 'aggregate', on: ['foo'], aggregations: [] } },
      });
      await wrapper.vm.$nextTick();
      expect(wrapper.vm.$store.state.vqb.selectedColumns).toEqual(['foo']);
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
            name: 'aggregate',
            on: [],
            aggregations: [{ column: 'foo', newColumn: 'bar', aggfunction: 'sum' }],
          },
        },
      });
      await wrapper.vm.$nextTick();
      expect(wrapper.find('listwidget-stub').props().value).toEqual([
        { column: 'foo', newColumn: 'bar', aggfunction: 'sum' },
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
        testlabel: '"on" parameter is an empty string',
        props: {
          initialStepValue: {
            name: 'aggregate',
            on: [''],
            aggregations: [
              {
                newColumn: 'sum_col1',
                aggfunction: 'sum',
                column: 'col1',
              },
            ],
          },
        },
        errors: [{ keyword: 'minLength', dataPath: '.on[0]' }],
      },
      {
        testlabel: '"column" parameter is an empty string',
        props: {
          initialStepValue: {
            name: 'aggregate',
            on: ['column1'],
            aggregations: [
              {
                newColumn: '',
                aggfunction: 'sum',
                column: '',
              },
            ],
          },
        },
        errors: [
          { keyword: 'minLength', dataPath: '.aggregations[0].column' },
          // newColumn is computed based on column so an error is also returned for this parameter
          { keyword: 'minLength', dataPath: '.aggregations[0].newColumn' },
        ],
      },
      {
        testlabel: '"aggfunction" unknown',
        props: {
          initialStepValue: {
            name: 'aggregate',
            on: ['column1'],
            aggregations: [
              {
                newColumn: 'foo_col1',
                aggfunction: 'foo',
                column: 'col1',
              },
            ],
          },
        },
        errors: [{ keyword: 'enum', dataPath: '.aggregations[0].aggfunction' }],
      },
    ]);

    runner.testValidate({
      testlabel: 'submitted data is valid',
      props: {
        initialStepValue: {
          name: 'aggregate',
          on: ['foo'],
          aggregations: [{ column: 'bar', newColumn: 'bar', aggfunction: 'sum' }],
        },
      },
    });

    it('should keep the same column name as newColumn if only one aggregation is performed', () => {
      const wrapper = runner.mount(undefined, {
        data: {
          editedStep: {
            name: 'aggregate',
            on: ['foo'],
            aggregations: [{ column: 'bar', newColumn: '', aggfunction: 'sum' }],
          },
        },
      });
      wrapper.find('.widget-form-action__button--validate').trigger('click');
      expect(wrapper.vm.$data.errors).toBeNull();
      expect(wrapper.vm.$data.editedStep.aggregations[0].newColumn).toEqual('bar');
    });

    it('should set newColumn cleverly if several aggregations are performed o, the same column', () => {
      const wrapper = runner.mount(undefined, {
        data: {
          editedStep: {
            name: 'aggregate',
            on: ['foo'],
            aggregations: [
              { column: 'bar', newColumn: '', aggfunction: 'sum' },
              { column: 'bar', newColumn: '', aggfunction: 'avg' },
            ],
          },
        },
      });
      wrapper.find('.widget-form-action__button--validate').trigger('click');
      expect(wrapper.vm.$data.errors).toBeNull();
      expect(wrapper.vm.$data.editedStep.aggregations[0].newColumn).toEqual('bar-sum');
      expect(wrapper.vm.$data.editedStep.aggregations[1].newColumn).toEqual('bar-avg');
    });
  });

  runner.testCancel();
  runner.testResetSelectedIndex();

  it('should change the column focus after input in multiselect', async () => {
    const initialState = { selectedColumns: [] };
    const wrapper = runner.mount(initialState, {
      data: { editedStep: { name: 'aggregate', on: ['foo'], aggregations: [] } },
    });
    wrapper.find(MultiselectWidget).trigger('input');
    await wrapper.vm.$nextTick();
    expect(wrapper.vm.$store.state.vqb.selectedColumns).toEqual(['foo']);
  });
});
