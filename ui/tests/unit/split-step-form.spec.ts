import SplitStepForm from '@/components/stepforms/SplitStepForm.vue';

import { BasicStepFormTestRunner } from './utils';

jest.mock('@/components/FAIcon.vue');

describe('Split Step Form', () => {
  const runner = new BasicStepFormTestRunner(SplitStepForm, 'split');
  runner.testInstantiate();
  runner.testExpectedComponents({
    'columnpicker-stub': 1,
    'inputtextwidget-stub': 2,
  });
  runner.testValidationErrors([
    {
      testlabel: 'submitted data is not valid',
      errors: [
        { keyword: 'required', dataPath: '' },
        { keyword: 'minLength', dataPath: '.column' },
        { keyword: 'minLength', dataPath: '.delimiter' },
      ],
    },
  ]);

  runner.testValidate({
    testlabel: 'submitted data is valid',
    props: {
      initialStepValue: { name: 'split', column: 'foo', delimiter: '-', number_cols_to_keep: 3 },
    },
  });

  runner.testCancel();
  runner.testResetSelectedIndex();

  it('should pass down the properties to the input components', async () => {
    const wrapper = runner.shallowMount(undefined, {
      data: {
        editedStep: { name: 'split', column: 'foo', delimiter: '-', number_cols_to_keep: 3 },
      },
    });
    await wrapper.vm.$nextTick();
    expect(wrapper.find('.delimiter').props('value')).toEqual('-');
    expect(wrapper.find('.numberColsToKeep').props('value')).toEqual(3);
  });
});
