import CustomStepForm from '@/components/stepforms/CustomStepForm.vue';

import { BasicStepFormTestRunner } from './utils';

jest.mock('@/components/FAIcon.vue');

describe('Custom Step Form', () => {
  const runner = new BasicStepFormTestRunner(CustomStepForm, 'custom');
  runner.testInstantiate();
  runner.testExpectedComponents({
    'codeeditorwidget-stub': 1,
  });
  runner.testValidationErrors([
    {
      testlabel: 'submitted query should not be empty',
      props: {
        initialStepValue: {
          name: 'custom',
          query: '',
        },
      },
      errors: [{ dataPath: '.query', keyword: 'minLength' }],
    },
    {
      testlabel: 'submitted query is not json', // only for translator: mongo40 (which is default translator)
      props: {
        initialStepValue: {
          name: 'custom',
          query: 'a',
        },
      },
      errors: [{ dataPath: '.query', keyword: 'json' }],
    },
  ]);
});
