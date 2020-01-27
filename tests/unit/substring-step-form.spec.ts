import SubstringStepForm from '@/components/stepforms/SubstringStepForm.vue';

import { BasicStepFormTestRunner } from './utils';

describe('Substring Step Form', () => {
  const runner = new BasicStepFormTestRunner(SubstringStepForm, 'substring');
  runner.testInstantiate();
  runner.testExpectedComponents({
    'columnpicker-stub': 1,
    'inputtextwidget-stub': 2,
  });
  runner.testValidationErrors([
    {
      testlabel: 'submitted data is not valid',
      errors: [{ keyword: 'minLength', dataPath: '.column' }],
    },
  ]);

  runner.testValidate({
    testlabel: 'submitted data is valid',
    props: {
      initialStepValue: {
        name: 'substring',
        column: 'foo',
        start_index: 1,
        end_index: 3,
      },
    },
  });

  runner.testCancel();
  runner.testResetSelectedIndex();

  it('should pass down the properties to the input components', async () => {
    const wrapper = runner.shallowMount(undefined, {
      data: {
        editedStep: { name: 'Substring', column: 'foo', start_index: 1, end_index: 3 },
      },
    });
    await wrapper.vm.$nextTick();
    expect(wrapper.find('#startIndex').props('value')).toEqual(1);
    expect(wrapper.find('#endIndex').props('value')).toEqual(3);
  });
});
