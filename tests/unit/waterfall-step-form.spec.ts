import WaterfallStepForm from '@/components/stepforms/WaterfallStepForm.vue';

import { BasicStepFormTestRunner, setupMockStore } from './utils';

describe('Waterfall Step Form', () => {
  const runner = new BasicStepFormTestRunner(WaterfallStepForm, 'waterfall');
  runner.testInstantiate();
  runner.testExpectedComponents({
    'autocompletewidget-stub': 2,
    'columnpicker-stub': 4,
    'multiselectwidget-stub': 1,
    'inputtextwidget-stub': 2,
  });

  describe('MultiselectWidget', () => {
    it('should instantiate a MultiselectWidget widget with proper options from the store', () => {
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

    it('should pass down the props to the MultiselectWidget value prop', async () => {
      const wrapper = runner.shallowMount(undefined, {
        data: {
          editedStep: {
            name: 'waterfall',
            valueColumn: 'VALUE',
            milestonesColumn: 'DATE',
            start: '2019',
            end: '2020',
            labelsColumn: 'PRODUCT',
            groupby: ['COUNTRY'],
            sortBy: 'value',
            order: 'desc',
          },
        },
      });
      await wrapper.vm.$nextTick();
      const widgetMultiselect = wrapper.find('multiselectwidget-stub');
      expect(widgetMultiselect.props().value).toEqual(['COUNTRY']);
    });
  });

  describe('Validation', () => {
    runner.testValidationErrors([
      {
        testlabel: '"groupby" parameter is an empty string',
        props: {
          initialStepValue: {
            name: 'waterfall',
            valueColumn: 'VALUE',
            milestonesColumn: 'DATE',
            start: '2019',
            end: '2020',
            labelsColumn: 'PRODUCT',
            groupby: [''],
            sortBy: 'value',
            order: 'desc',
          },
        },
        errors: [{ keyword: 'minLength', dataPath: '.groupby[0]' }],
      },
      {
        testlabel: '"start" parameter is an empty string',
        props: {
          initialStepValue: {
            name: 'waterfall',
            valueColumn: 'VALUE',
            milestonesColumn: 'DATE',
            start: '',
            end: '2020',
            labelsColumn: 'PRODUCT',
            sortBy: 'value',
            order: 'desc',
          },
        },
        errors: [{ keyword: 'minLength', dataPath: '.start' }],
      },
      {
        testlabel: '"end" parameter is an empty string',
        props: {
          initialStepValue: {
            name: 'waterfall',
            valueColumn: 'VALUE',
            milestonesColumn: 'DATE',
            start: '2019',
            end: '',
            labelsColumn: 'PRODUCT',
            sortBy: 'value',
            order: 'desc',
          },
        },
        errors: [{ keyword: 'minLength', dataPath: '.end' }],
      },
    ]);

    runner.testValidate({
      testlabel: 'submitted data is valid',
      store: setupMockStore({
        dataset: {
          headers: [{ name: 'columnA' }],
          data: [],
        },
      }),
      props: {
        initialStepValue: {
          name: 'waterfall',
          valueColumn: 'VALUE',
          milestonesColumn: 'DATE',
          start: '2019',
          end: '2020',
          labelsColumn: 'PRODUCT',
          groupby: ['COUNTRY'],
          sortBy: 'value',
          order: 'desc',
        },
      },
    });
  });

  runner.testCancel();
  runner.testResetSelectedIndex();
});
