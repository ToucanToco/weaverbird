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

    it('keepOriginalGranularity should be set properly if defined in inititalStepValue', async () => {
      const wrapper = runner.shallowMount(undefined, {
        propsData: {
          initialStepValue: {
            name: 'aggregate',
            on: [''],
            aggregations: [],
            keepOriginalGranularity: true,
          },
        },
      });
      await wrapper.vm.$nextTick();
      expect(wrapper.vm.$data.editedStep.keepOriginalGranularity).toEqual(true);
    });

    it('keepOriginalGranularity should be set to false if undefined in inititalValue', async () => {
      const wrapper = runner.shallowMount(undefined, {
        propsData: {
          initialStepValue: {
            name: 'aggregate',
            on: [''],
            aggregations: [],
            keepOriginalGranularity: undefined,
          },
        },
      });
      await wrapper.vm.$nextTick();
      expect(wrapper.vm.$data.editedStep.keepOriginalGranularity).toEqual(false);
    });

    it('should pass down the "on" prop to the MultiselectWidget value prop', async () => {
      const wrapper = runner.shallowMount(undefined, {
        data: {
          editedStep: {
            name: 'aggregate',
            on: ['foo', 'bar'],
            aggregations: [],
          },
        },
      });
      await wrapper.vm.$nextTick();
      expect(wrapper.find('multiselectwidget-stub').props().value).toEqual(['foo', 'bar']);
    });

    it('should call the setColumnMutation on input', async () => {
      const wrapper = runner.mount(undefined, {
        data: {
          editedStep: {
            name: 'aggregate',
            on: ['foo'],
            aggregations: [],
          },
        },
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
            aggregations: [{ column: 'foo', newcolumn: 'bar', aggfunction: 'sum' }],
            keepOriginalGranularity: false,
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
      const autocompleteWrapper = wrapper.find(AutocompleteWidget);
      const multiselectWrappers = wrapper.findAll(MultiselectWidget);
      expect(autocompleteWrapper.props().value).toEqual('sum');
      expect(multiselectWrappers.at(1).props().value).toEqual([]);
    });
  });

  describe('Validation', () => {
    runner.testValidationErrors([
      {
        testlabel: '"on" parameter includes an empty string',
        props: {
          initialStepValue: {
            name: 'aggregate',
            on: [''],
            aggregations: [
              {
                newcolumns: ['sum_col1'],
                aggfunction: 'sum',
                columns: ['col1'],
              },
            ],
            keepOriginalGranularity: false,
          },
        },
        errors: [{ keyword: 'minLength', dataPath: '.on[0]' }],
      },
      {
        testlabel: '"columns" and "newcolumns" parameters include empty strings',
        props: {
          initialStepValue: {
            name: 'aggregate',
            on: ['column1'],
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
          { keyword: 'minLength', dataPath: '.aggregations[0].columns[0]' },
          { keyword: 'minLength', dataPath: '.aggregations[0].newcolumns[0]' },
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
                newcolumns: ['foo_col1'],
                aggfunction: 'foo',
                columns: ['col1'],
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
          aggregations: [{ columns: ['bar'], newcolumns: ['bar'], aggfunction: 'sum' }],
          keepOriginalGranularity: false,
        },
      },
    });
  });

  it('should keep the same column name as newcolumn if only one aggregation is performed', () => {
    const wrapper = runner.mount(undefined, {
      data: {
        editedStep: {
          name: 'aggregate',
          on: ['foo'],
          aggregations: [{ columns: ['bar'], newcolumns: [''], aggfunction: 'sum' }],
        },
      },
    });
    wrapper.find('.widget-form-action__button--validate').trigger('click');
    expect(wrapper.vm.$data.errors).toBeNull();
    expect(wrapper.vm.$data.editedStep.aggregations[0].newcolumns[0]).toEqual('bar');
  });

  it('should set newcolumn cleverly if several aggregations are performed on the same column', () => {
    const wrapper = runner.mount(undefined, {
      data: {
        editedStep: {
          name: 'aggregate',
          on: ['foo'],
          aggregations: [
            { columns: ['bar', 'test'], newcolumns: [''], aggfunction: 'sum' },
            { columns: ['bar', 'test'], newcolumns: [''], aggfunction: 'avg' },
          ],
        },
      },
    });
    wrapper.find('.widget-form-action__button--validate').trigger('click');
    expect(wrapper.vm.$data.errors).toBeNull();
    expect(wrapper.vm.$data.editedStep.aggregations[0].newcolumns[0]).toEqual('bar-sum');
    expect(wrapper.vm.$data.editedStep.aggregations[1].newcolumns[0]).toEqual('bar-avg');
    expect(wrapper.vm.$data.editedStep.aggregations[0].newcolumns[1]).toEqual('test-sum');
    expect(wrapper.vm.$data.editedStep.aggregations[1].newcolumns[1]).toEqual('test-avg');
  });

  it('should set newcolumn cleverly if the an aggregation is perform on an id column', () => {
    const wrapper = runner.mount(undefined, {
      data: {
        editedStep: {
          name: 'aggregate',
          on: ['foo'],
          aggregations: [{ columns: ['foo'], newcolumns: [''], aggfunction: 'count' }],
        },
      },
    });
    wrapper.find('.widget-form-action__button--validate').trigger('click');
    expect(wrapper.vm.$data.errors).toBeNull();
    expect(wrapper.vm.$data.editedStep.aggregations[0].newcolumns[0]).toEqual('foo-count');
  });

  it('should set newcolumn cleverly if we keep the original granularity', () => {
    const wrapper = runner.mount(undefined, {
      data: {
        editedStep: {
          name: 'aggregate',
          on: ['foo'],
          aggregations: [{ columns: ['bar'], newcolumns: [''], aggfunction: 'sum' }],
          keepOriginalGranularity: true,
        },
      },
    });
    wrapper.find('.widget-form-action__button--validate').trigger('click');
    expect(wrapper.vm.$data.errors).toBeNull();
    expect(wrapper.vm.$data.editedStep.aggregations[0].newcolumns[0]).toEqual('bar-sum');
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

  it('should convert editedStep from old configurations to new configuration', async () => {
    const wrapper = runner.shallowMount(
      {},
      {
        propsData: {
          initialStepValue: {
            name: 'aggregate',
            on: ['index'],
            aggregations: [
              { column: 'foo', newcolumn: 'foo', aggregation: 'sum' },
              { column: 'bar', newcolumn: 'bar', aggregation: 'sum' },
              { columns: ['foo', 'bar'], newcolumns: ['foo', 'bar'], aggregation: 'sum' },
            ],
          },
        },
      },
    );
    await wrapper.vm.$nextTick();
    expect(wrapper.vm.$data.editedStep.aggregations).toEqual([
      { columns: ['foo'], newcolumns: ['foo'], aggregation: 'sum' },
      { columns: ['bar'], newcolumns: ['bar'], aggregation: 'sum' },
      { columns: ['foo', 'bar'], newcolumns: ['foo', 'bar'], aggregation: 'sum' },
    ]);
  });
});
