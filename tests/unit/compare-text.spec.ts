import CompareTextStepForm from '@/components/stepforms/CompareTextStepForm.vue';

import { BasicStepFormTestRunner } from './utils';

describe('Compute Text Columns Step Form', () => {
  const runner = new BasicStepFormTestRunner(CompareTextStepForm, 'strcmp');
  runner.testInstantiate();
  runner.testExpectedComponents({
    'columnpicker-stub': 2,
    'inputtextwidget-stub': 1,
  });

  runner.testValidationErrors([
    {
      testlabel: 'submitted data is not valid',
      errors: [
        { keyword: 'minLength', dataPath: '.newColumnName' },
        { keyword: 'minLength', dataPath: '.strCol1' },
        { keyword: 'minLength', dataPath: '.strCol2' },
      ],
    },
  ]);

  runner.testValidate({
    testlabel: 'submitted data is valid',
    props: {
      initialStepValue: {
        name: 'strcmp',
        newColumnName: 'NEW',
        strCol1: 'C1',
        strCol2: 'C2',
      },
    },
  });

  runner.testCancel();
  runner.testResetSelectedIndex();

  it('should pass down properties', async () => {
    const wrapper = runner.shallowMount();
    wrapper.setData({
      editedStep: {
        name: 'strcmp',
        newColumnName: 'NEW',
        strCol1: 'C1',
        strCol2: 'C2',
      },
    });
    await wrapper.vm.$nextTick();
    expect(wrapper.find('.newColumnNameInput').props('value')).toEqual('NEW');
    expect(wrapper.find('.strCol1Input').props('value')).toEqual('C1');
    expect(wrapper.find('.strCol2Input').props('value')).toEqual('C2');
  });

  it('should make the focus on the column added after validation', () => {
    const initialState = {
      dataset: {
        headers: [{ name: 'start' }, { name: 'end' }],
        data: [],
      },
    };
    const wrapper = runner.mount(initialState);
    wrapper.setData({
      editedStep: {
        name: 'strcmp',
        newColumnName: 'NEW',
        strCol1: 'C1',
        strCol2: 'C2',
      },
    });
    wrapper.find('.widget-form-action__button--validate').trigger('click');
    expect(wrapper.vm.$store.state.vqb.selectedColumns).toEqual(['NEW']);
  });

  it('should not change the column focus if validation fails', () => {
    const initialState = {
      dataset: {
        headers: [{ name: 'C1' }, { name: 'C2' }],
        data: [],
      },
      selectedColumns: ['C1'],
    };
    const wrapper = runner.mount(initialState, {
      data: {
        editedStep: {
          name: 'strcmp',
          newColumnName: '',
          strCol1: '',
          strCol2: '',
        },
      },
    });
    wrapper.find('.widget-form-action__button--validate').trigger('click');
    expect(wrapper.vm.$store.state.vqb.selectedColumns).toEqual(['C1']);
  });

  describe('Warning', () => {
    it('should report a warning when newColumnName is an already existing column name', async () => {
      const initialState = {
        dataset: {
          headers: [{ name: 'NEW' }, { name: 'C1' }, { name: 'C2' }],
          data: [],
        },
      };
      const wrapper = runner.shallowMount(initialState);
      wrapper.setData({
        editedStep: {
          name: 'strcmp',
          newColumnName: 'NEW',
          strCol1: 'C1',
          strCol2: 'C2',
        },
      });
      await wrapper.vm.$nextTick();
      expect(wrapper.find('.newColumnNameInput').props().warning).toEqual(
        'A column name "NEW" already exists. You will overwrite it.',
      );
    });

    it('should not report any warning if newColumnName is not an already existing column name', async () => {
      const initialState = {
        dataset: {
          headers: [{ name: 'NEW' }, { name: 'C1' }, { name: 'C2' }],
          data: [],
        },
      };
      const wrapper = runner.shallowMount(initialState);
      wrapper.setData({
        editedStep: {
          name: 'strcmp',
          newColumnName: 'TEST',
          strCol1: 'C1',
          strCol2: 'C2',
        },
      });
      await wrapper.vm.$nextTick();
      expect(wrapper.find('.newColumnNameInput').props().warning).toBeNull();
    });
  });
});
