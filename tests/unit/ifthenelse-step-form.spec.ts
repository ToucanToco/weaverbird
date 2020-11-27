import IfThenElseStepForm from '@/components/stepforms/IfThenElseStepForm.vue';

import { BasicStepFormTestRunner, setupMockStore } from './utils';

describe.only('If...Then...Else Step Form', () => {
  const runner = new BasicStepFormTestRunner(IfThenElseStepForm, 'ifthenelse');

  runner.testInstantiate();
  runner.testExpectedComponents({
    'inputtextwidget-stub': 1,
    'ifthenelsewidget-stub': 1,
  });
  runner.testValidationErrors([
    {
      testlabel: 'submitted data is not valid',
      store: setupMockStore({
        dataset: {
          headers: [{ name: 'foo', type: 'string' }],
          data: [[null]],
        },
      }),
      data: {
        editedStep: {
          name: 'ifthenelse',
          newColumn: '',
          if: { column: '', value: '', operator: 'eq' },
          then: '',
          else: '',
        },
      },
      errors: [
        {
          dataPath: '.else',
          keyword: 'minLength',
        },
        {
          dataPath: '.else',
          keyword: 'type',
        },
        {
          dataPath: '.else',
          keyword: 'anyOf',
        },
        {
          dataPath: '.if',
          keyword: 'if',
        },
        {
          dataPath: '.if.column',
          keyword: 'minLength',
        },
        {
          dataPath: '.if.value',
          keyword: 'minLength',
        },
        {
          dataPath: '.newColumn',
          keyword: 'minLength',
        },
        {
          dataPath: '.then',
          keyword: 'minLength',
        },
      ],
    },
  ]);

  runner.testValidate({
    store: setupMockStore({
      dataset: {
        headers: [{ name: 'foo', type: 'string' }],
        data: [[null]],
      },
    }),
    props: {
      initialStepValue: {
        name: 'ifthenelse',
        newColumn: 'new',
        if: { column: 'foo', value: 'bar', operator: 'eq' },
        then: '123',
        else: '456',
      },
    },
  });

  runner.testCancel();
  runner.testResetSelectedIndex();

  describe('Warning new column name', () => {
    it('should report a warning when new_column is an already existing column name', async () => {
      const initialState = {
        dataset: {
          headers: [{ name: 'columnA' }],
          data: [],
        },
      };
      const wrapper = runner.shallowMount(initialState);
      wrapper.setData({
        editedStep: {
          name: 'ifthenelse',
          newColumn: 'columnA',
          if: { column: '', value: '', operator: 'eq' },
          then: '',
          else: '',
        },
      });
      await wrapper.vm.$nextTick();
      expect(wrapper.find('.newColumnInput').props().warning).toEqual(
        'A column name "columnA" already exists. You will overwrite it.',
      );
    });

    it('should not report any warning if new_column is not an already existing column name', async () => {
      const initialState = {
        dataset: {
          headers: [{ name: 'columnA' }],
          data: [],
        },
      };
      const wrapper = runner.shallowMount(initialState);
      wrapper.setData({
        editedStep: {
          name: 'ifthenelse',
          newColumn: 'columnB',
          if: { column: '', value: '', operator: 'eq' },
          then: '',
          else: '',
        },
      });
      await wrapper.vm.$nextTick();
      expect(wrapper.find('.newColumnInput').props().warning).toBeNull();
    });
  });

  it('should update editedStep with the if...then...else object', () => {
    const wrapper = runner.shallowMount(undefined, {
      data: {
        editedStep: {
          name: 'ifthenelse',
          newColumn: '',
          if: { column: '', value: '', operator: 'eq' },
          then: '',
          else: '',
        },
      },
    });
    wrapper.find('ifthenelsewidget-stub').vm.$emit('input', {
      if: { column: 'foo', value: 'bar', operator: 'eq' },
      then: '123',
      else: '456',
    });
    expect(wrapper.vm.$data.editedStep).toEqual({
      name: 'ifthenelse',
      newColumn: '',
      if: { column: 'foo', value: 'bar', operator: 'eq' },
      then: '123',
      else: '456',
    });
  });
});
