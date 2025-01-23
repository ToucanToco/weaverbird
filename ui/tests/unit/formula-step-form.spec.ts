import { describe, expect, it, vi } from 'vitest';

import FormulaStepForm from '@/components/stepforms/FormulaStepForm.vue';

import { BasicStepFormTestRunner } from './utils';

vi.mock('@/components/FAIcon.vue');

describe('Formula Step Form', () => {
  const runner = new BasicStepFormTestRunner(FormulaStepForm, 'formula');
  runner.testInstantiate();
  runner.testExpectedComponents({
    'inputtextwidget-stub': 2,
  });
  runner.testValidationErrors([
    {
      testlabel: 'submitted data is not valid',
      errors: [
        { keyword: 'minLength', dataPath: '.formula' },
        { keyword: 'minLength', dataPath: '.newColumn' },
      ],
    },
  ]);

  runner.testValidationErrors([
    {
      testlabel: 'submitted formula is not valid',
      props: {
        initialStepValue: { name: 'formula', formula: '= 3', newColumn: 'foo' },
      },
      errors: [{ keyword: 'parsing', dataPath: '.formula' }],
    },
  ]);

  runner.testValidate({
    testlabel: 'submitted data is valid with string formula',
    props: {
      initialStepValue: { name: 'formula', formula: 'ColumnA * 2', newColumn: 'foo' },
    },
  });

  runner.testValidate({
    testlabel: 'submitted data is valid with non string formula',
    props: {
      initialStepValue: { name: 'formula', formula: 42, newColumn: 'foo' },
    },
  });

  runner.testValidate({
    testlabel: 'submitted formula contains variables',
    props: {
      variableDelimiters: {
        start: '<%=',
        end: '%>',
      },
      initialStepValue: { name: 'formula', formula: '<%= some_var %>', newColumn: 'foo' },
    },
  });

  runner.testCancel();
  

  it('should pass down properties', async () => {
    const wrapper = runner.shallowMount({
      data: { editedStep: { name: 'formula', formula: 'ColumnA * 2', newColumn: 'foo' } },
    });
    await wrapper.vm.$nextTick();
    expect(wrapper.find('.newColumnInput').props('value')).toEqual('foo');
    expect(wrapper.find('.formulaInput').props('value')).toEqual('ColumnA * 2');
  });

  describe('Warning', () => {
    it('should report a warning when newColumn is an already existing column name', async () => {
      const wrapper = runner.shallowMount({
        propsData: {
          columnTypes: { columnA: 'string' },
        },
        data: { editedStep: { formula: '', newColumn: 'columnA' } },
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
        data: { editedStep: { formula: '', newColumn: 'columnB' } },
      });
      await wrapper.vm.$nextTick();
      expect(wrapper.find('.newColumnInput').props().warning).toBeNull();
    });
  });

  it('should make the focus on the column modified after validation', () => {
    const wrapper = runner.mount({
      propsData: {
        columnTypes: { columnA: 'string', columnB: 'string', columnC: 'string' },
      },
      data: { editedStep: { name: 'formula', formula: 'ColumnA * 2', newColumn: 'foo' } },
    });
    wrapper.find('.widget-form-action__button--validate').trigger('click');
    expect(wrapper.emitted().setSelectedColumns).toEqual([[{ column: 'foo' }]]);
  });
});
