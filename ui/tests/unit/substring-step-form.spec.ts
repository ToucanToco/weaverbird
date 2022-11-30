import { describe, expect, it, vi } from 'vitest';

import SubstringStepForm from '@/components/stepforms/SubstringStepForm.vue';

import { BasicStepFormTestRunner, setupMockStore } from './utils';

vi.mock('@/components/FAIcon.vue');

describe('Substring Step Form', () => {
  const runner = new BasicStepFormTestRunner(SubstringStepForm, 'substring');
  runner.testInstantiate();
  runner.testExpectedComponents({
    'columnpicker-stub': 1,
    'inputtextwidget-stub': 3,
  });
  runner.testValidationErrors([
    {
      testlabel: 'submitted data is not valid',
      errors: [{ keyword: 'minLength', dataPath: '.column' }],
    },
    {
      testlabel: 'existing column name',
      store: setupMockStore({
        dataset: {
          headers: [{ name: 'bar' }],
          data: [],
        },
      }),
      data: {
        editedStep: {
          name: 'substring',
          column: 'foo',
          startIndex: 1,
          endIndex: 3,
          newColumnName: 'bar',
        },
      },
      errors: [{ keyword: 'columnNameAlreadyUsed', dataPath: '.newColumnName' }],
    },
  ]);

  runner.testValidate({
    testlabel: 'submitted data is valid',
    props: {
      initialStepValue: {
        name: 'substring',
        column: 'foo',
        startIndex: 1,
        endIndex: 3,
      },
    },
  });

  runner.testCancel();
  runner.testResetSelectedIndex();

  it('should pass down the properties to the input components', async () => {
    const wrapper = runner.shallowMount(undefined, {
      data: {
        editedStep: { name: 'Substring', column: 'foo', startIndex: 1, endIndex: 3 },
      },
    });
    await wrapper.vm.$nextTick();
    expect(wrapper.find('.startIndex').props('value')).toEqual(1);
    expect(wrapper.find('.endIndex').props('value')).toEqual(3);
  });
});
