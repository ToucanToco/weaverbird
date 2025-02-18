import { describe, expect, it, vi } from 'vitest';

import IfThenElseStepForm from '@/components/stepforms/IfThenElseStepForm.vue';

import { BasicStepFormTestRunner } from './utils';

vi.mock('@/components/FAIcon.vue');

describe('If...Then...Else Step Form', () => {
  const runner = new BasicStepFormTestRunner(IfThenElseStepForm, 'ifthenelse');

  runner.testInstantiate();
  runner.testExpectedComponents({
    'inputtextwidget-stub': 1,
    'ifthenelsewidget-stub': 1,
  });
  runner.testValidationErrors([
    {
      testlabel: 'submitted data is not valid',
      props: {
        columnTypes: { foo: 'string' },
      },
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
    props: {
      columnTypes: { foo: 'string' },
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

  describe('Warning new column name', () => {
    it('should report a warning when newColumn is an already existing column name', async () => {
      const wrapper = runner.shallowMount({
        propsData: {
          columnTypes: { columnA: 'string' },
        },
      });
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

    it('should not report any warning if newColumn is not an already existing column name', async () => {
      const wrapper = runner.shallowMount({
        propsData: {
          columnTypes: { columnA: 'string' },
        },
      });
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

  it('should pass the column types to the IfThenElse widget', () => {
    const wrapper = runner.shallowMount({
      propsData: {
        columnTypes: { foo: 'string' },
      },
    });
    expect(wrapper.find('IfThenElseWidget-stub').props().columnTypes).toStrictEqual({
      foo: 'string',
    });
  });

  it('should update editedStep with the if...then...else object', () => {
    const wrapper = runner.shallowMount({
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
