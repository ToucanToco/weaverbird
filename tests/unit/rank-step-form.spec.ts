import RankStepForm from '@/components/stepforms/RankStepForm.vue';

import { BasicStepFormTestRunner, setupMockStore } from './utils';

jest.mock('@/components/FAIcon.vue');

describe('Cumsum Step Form', () => {
  const runner = new BasicStepFormTestRunner(RankStepForm, 'rank');
  runner.testInstantiate();
  runner.testExpectedComponents({
    'autocompletewidget-stub': 2,
    'columnpicker-stub': 1,
    'multiselectwidget-stub': 1,
    'inputtextwidget-stub': 1,
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
            name: 'rank',
            valueCol: 'VALUE',
            order: 'desc',
            method: 'standard',
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
            name: 'rank',
            valueCol: 'VALUE',
            order: 'desc',
            method: 'standard',
            groupby: [''],
          },
        },
        errors: [{ keyword: 'minLength', dataPath: '.groupby[0]' }],
      },
      {
        testlabel: '"newColumnName" parameter is an empty string',
        props: {
          initialStepValue: {
            name: 'rank',
            valueCol: 'VALUE',
            order: 'desc',
            method: 'standard',
            newColumnName: '',
          },
        },
        errors: [{ keyword: 'minLength', dataPath: '.newColumnName' }],
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
            name: 'rank',
            valueCol: 'VALUE',
            order: 'desc',
            method: 'standard',
            newColumnName: 'columnA',
          },
        },
        errors: [{ keyword: 'columnNameAlreadyUsed', dataPath: '.newColumnName' }],
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
          name: 'rank',
          valueCol: 'VALUE',
          order: 'desc',
          method: 'standard',
          groupby: ['foo', 'bar'],
          newColumnName: 'newCol',
        },
      },
    });
  });

  runner.testCancel();
  runner.testResetSelectedIndex();
});
