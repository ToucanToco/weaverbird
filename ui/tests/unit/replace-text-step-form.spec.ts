import { describe, expect, it, vi } from 'vitest';

import ReplaceTextStepForm from '@/components/stepforms/ReplaceTextStepForm.vue';

import { BasicStepFormTestRunner } from './utils';

vi.mock('@/components/FAIcon.vue');

describe('Replace Text Step Form', () => {
  const runner = new BasicStepFormTestRunner(ReplaceTextStepForm, 'replacetext');
  runner.testInstantiate();
  runner.testExpectedComponents({
    'columnpicker-stub': 1,
    'inputtextwidget-stub': 2,
  });
  runner.testValidate({
    testlabel: 'submitted data is valid',
    props: {
      columnTypes: { toto: 'string', foo: 'string' },
      initialStepValue: { name: 'replacetext', searchColumn: 'foo', oldStr: 'old', newStr: 'new' },
    },
  });

  runner.testCancel();

  it('should pass down "searchColumn" to ColumnPicker', async () => {
    const wrapper = runner.shallowMount({
      data: {
        editedStep: {
          name: 'replacetext',
          searchColumn: 'test',
          oldStr: 'old',
          newStr: 'new',
        },
      },
    });
    await wrapper.vm.$nextTick();
    expect(wrapper.find('columnpicker-stub').attributes().value).toEqual('test');
  });

  it('should pass down "oldStr" to TextInputWidget', async () => {
    const wrapper = runner.shallowMount({
      data: {
        editedStep: {
          name: 'replacetext',
          searchColumn: 'test',
          oldStr: 'coucou',
        },
      },
    });
    await wrapper.vm.$nextTick();
    expect(wrapper.find('inputtextwidget-stub').props().value).toEqual('coucou');
  });

  it('should pass down "newStr" to TextInputWidget', async () => {
    const wrapper = runner.shallowMount({
      data: {
        editedStep: {
          name: 'replacetext',
          searchColumn: 'test',
          oldStr: 'coucou',
          newStr: 'hello',
        },
      },
    });
    await wrapper.vm.$nextTick();
    expect(wrapper.findAll('inputtextwidget-stub').at(1).props().value).toEqual('hello');
  });
});
