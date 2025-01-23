import { describe, expect, it, vi } from 'vitest';

import RankStepForm from '@/components/stepforms/RankStepForm.vue';

import { BasicStepFormTestRunner } from './utils';

vi.mock('@/components/FAIcon.vue');

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
      const wrapper = runner.shallowMount({
        propsData: {
          columnTypes: { columnA: 'string', columnB: 'string', columnC: 'string' },
        },
      });
      const widgetMultiselect = wrapper.find('multiselectwidget-stub');
      expect(widgetMultiselect.attributes('options')).toEqual('columnA,columnB,columnC');
    });

    it('should pass down the props to the MultiselectWidget value prop', async () => {
      const wrapper = runner.shallowMount({
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
        errors: [{ keyword: 'minLength', dataPath: '.groupby.0' }],
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
        props: {
          columnTypes: { columnA: 'string' },
        },
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
      props: {
        columnTypes: { columnA: 'string' },
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
  
});
