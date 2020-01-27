import FormulaStepForm from '@/components/stepforms/FormulaStepForm.vue';

import { BasicStepFormTestRunner } from './utils';

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

  runner.testValidate({
    testlabel: 'submitted data is valid',
    props: {
      initialStepValue: { name: 'formula', formula: 'ColumnA * 2', new_column: 'foo' },
    },
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
    expect(
      wrapper
        .findAll('inputtextwidget-stub')
        .at(0)
        .props('value'),
    ).toEqual('ColumnA * 2');
    expect(
      wrapper
        .findAll('inputtextwidget-stub')
        .at(1)
        .props('value'),
    ).toEqual('foo');
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
      const inputText = wrapper.findAll('inputtextwidget-stub');
      expect(inputText.at(1).props().warning).toEqual(
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
      const inputText = wrapper.findAll('inputtextwidget-stub');
      expect(inputText.at(1).props().warning).toBeNull();
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
