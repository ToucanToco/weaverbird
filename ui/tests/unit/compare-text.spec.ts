import { describe, expect, it, vi } from 'vitest';

import CompareTextStepForm from '@/components/stepforms/CompareTextStepForm.vue';

import { BasicStepFormTestRunner } from './utils';

vi.mock('@/components/FAIcon.vue');

describe('Compute Text Columns Step Form', () => {
  const runner = new BasicStepFormTestRunner(CompareTextStepForm, 'comparetext');
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
        name: 'comparetext',
        newColumnName: 'NEW',
        strCol1: 'C1',
        strCol2: 'C2',
      },
    },
  });

  runner.testCancel();

  it('should pass down properties', async () => {
    const wrapper = runner.shallowMount();
    wrapper.setData({
      editedStep: {
        name: 'comparetext',
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
    const wrapper = runner.mount({
      propsData: {
        columnTypes: { start: 'string', end: 'string' },
      },
    });
    wrapper.setData({
      editedStep: {
        name: 'comparetext',
        newColumnName: 'NEW',
        strCol1: 'C1',
        strCol2: 'C2',
      },
    });
    wrapper.find('.widget-form-action__button--validate').trigger('click');
    expect(wrapper.emitted().setSelectedColumns).toEqual([[{ column: 'NEW' }]]);
  });

  it('should not change the column focus if validation fails', () => {
    const wrapper = runner.mount({
      propsData: {
        columnTypes: { C1: 'string', C2: 'string' },
        selectedColumns: ['C1'],
      },
      data: {
        editedStep: {
          name: 'comparetext',
          newColumnName: '',
          strCol1: '',
          strCol2: '',
        },
      },
    });
    wrapper.find('.widget-form-action__button--validate').trigger('click');
    expect(wrapper.emitted().setSelectedColumns).toBeUndefined();
  });

  describe('Warning', () => {
    it('should report a warning when newColumnName is an already existing column name', async () => {
      const wrapper = runner.shallowMount({
        propsData: {
          columnTypes: { NEW: 'string', C1: 'string', C2: 'string' },
        },
      });
      wrapper.setData({
        editedStep: {
          name: 'comparetext',
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
      const wrapper = runner.shallowMount({
        propsData: {
          columnTypes: { NEW: 'string', C1: 'string', C2: 'string' },
        },
      });
      wrapper.setData({
        editedStep: {
          name: 'comparetext',
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
