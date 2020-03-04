import CumSumStepForm from '@/components/stepforms/CumSumStepForm.vue';

import { BasicStepFormTestRunner, setupMockStore } from './utils';

describe('Cumsum Step Form', () => {
  const runner = new BasicStepFormTestRunner(CumSumStepForm, 'cumsum');
  runner.testInstantiate();
  runner.testExpectedComponents({
    'columnpicker-stub': 2,
    'multiselectwidget-stub': 1,
    'inputtextwidget-stub': 1,
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
      const widgetMultiselect = wrapper.find('multiselectwidget-stub');
      expect(widgetMultiselect.attributes('options')).toEqual('columnA,columnB,columnC');
    });

    it('should pass down the props to the MultiselectWidget value prop', async () => {
      const wrapper = runner.shallowMount(undefined, {
        data: {
          editedStep: {
            name: 'cumsum',
            valueColumn: 'myValues',
            referenceColumn: 'myDates',
            groupby: ['foo', 'bar'],
          },
        },
      });
      await wrapper.vm.$nextTick();
      const widgetMultiselect = wrapper.find('multiselectwidget-stub');
      expect(widgetMultiselect.props().value).toEqual(['foo', 'bar']);
    });
  });

  describe('Validation', () => {
    runner.testValidationErrors([
      {
        testlabel: '"groupby" parameter is an empty string',
        props: {
          initialStepValue: {
            name: 'cumsum',
            valueColumn: 'myValues',
            referenceColumn: 'myDates',
            groupby: [''],
          },
        },
        errors: [{ keyword: 'minLength', dataPath: '.groupby[0]' }],
      },
      {
        testlabel: '"newColumn" parameter is an empty string',
        props: {
          initialStepValue: {
            name: 'cumsum',
            valueColumn: 'myValues',
            referenceColumn: 'myDates',
            newColumn: '',
          },
        },
        errors: [{ keyword: 'minLength', dataPath: '.newColumn' }],
      },
      {
        testlabel: 'existing column name',
        store: setupMockStore({
          dataset: {
            headers: [{ name: 'columnA' }],
            data: [],
          },
        }),
        data: {
          editedStep: {
            name: 'cumsum',
            valueColumn: 'myValues',
            referenceColumn: 'myDates',
            newColumn: 'columnA',
          },
        },
        errors: [{ keyword: 'columnNameAlreadyUsed', dataPath: '.newColumn' }],
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
          name: 'cumsum',
          valueColumn: 'myValues',
          referenceColumn: 'myDates',
          groupby: ['foo', 'bar'],
          newColumn: 'myNewColumn',
        },
      },
    });
  });

  runner.testCancel();
  runner.testResetSelectedIndex();
});
