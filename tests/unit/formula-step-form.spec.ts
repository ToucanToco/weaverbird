import FormulaStepForm from '@/components/stepforms/FormulaStepForm.vue';

import { BasicStepFormTestRunner, setupMockStore } from './utils';

jest.mock('@/components/FAIcon.vue');

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
        { keyword: 'minLength', dataPath: '.new_column' },
      ],
    },
  ]);

  runner.testValidationErrors([
    {
      testlabel: 'submitted formula is not valid',
      props: {
        initialStepValue: { name: 'formula', formula: '= 3', new_column: 'foo' },
      },
      errors: [{ keyword: 'parsing', dataPath: '.formula' }],
    },
  ]);

  runner.testValidate({
    testlabel: 'submitted data is valid with string formula',
    props: {
      initialStepValue: { name: 'formula', formula: 'ColumnA * 2', new_column: 'foo' },
    },
  });

  runner.testValidate({
    testlabel: 'submitted data is valid with non string formula',
    props: {
      initialStepValue: { name: 'formula', formula: 42, new_column: 'foo' },
    },
  });

  runner.testValidate({
    testlabel: 'submitted formula contains variables',
    props: {
      initialStepValue: { name: 'formula', formula: '<%= some_var %>', new_column: 'foo' },
    },
    store: setupMockStore({
      variableDelimiters: {
        start: '<%=',
        end: '%>',
      },
    }),
  });

  runner.testCancel();
  runner.testResetSelectedIndex();

  it('should pass down properties', async () => {
    const wrapper = runner.shallowMount(
      {},
      {
        data: { editedStep: { name: 'formula', formula: 'ColumnA * 2', new_column: 'foo' } },
      },
    );
    await wrapper.vm.$nextTick();
    expect(wrapper.find('.newColumnInput').props('value')).toEqual('foo');
    expect(wrapper.find('.formulaInput').props('value')).toEqual('ColumnA * 2');
  });

  describe('Warning', () => {
    it('should report a warning when new_column is an already existing column name', async () => {
      const initialState = {
        dataset: {
          headers: [{ name: 'columnA' }],
          data: [],
        },
      };
      const wrapper = runner.shallowMount(initialState, {
        data: { editedStep: { formula: '', new_column: 'columnA' } },
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
      const wrapper = runner.shallowMount(initialState, {
        data: { editedStep: { formula: '', new_column: 'columnB' } },
      });
      await wrapper.vm.$nextTick();
      expect(wrapper.find('.newColumnInput').props().warning).toBeNull();
    });
  });

  it('should make the focus on the column modified after validation', () => {
    const initialState = {
      dataset: {
        headers: [{ name: 'columnA' }, { name: 'columnB' }, { name: 'columnC' }],
        data: [],
      },
    };
    const wrapper = runner.mount(initialState, {
      data: { editedStep: { name: 'formula', formula: 'ColumnA * 2', new_column: 'foo' } },
    });
    wrapper.find('.widget-form-action__button--validate').trigger('click');
    expect(wrapper.vm.$store.state.vqb.selectedColumns).toEqual(['foo']);
  });
});
