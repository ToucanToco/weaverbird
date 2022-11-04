import SimplifyStepForm from '@/components/stepforms/SimplifyStepForm.vue';

import { BasicStepFormTestRunner, setupMockStore } from './utils';

jest.mock('@/components/FAIcon.vue');

describe('Simplify Step Form', () => {
  const runner = new BasicStepFormTestRunner(SimplifyStepForm, 'simplify');
  runner.testInstantiate();
  runner.testExpectedComponents({
    'inputnumberwidget-stub': 1,
  });
  runner.testCancel();
  runner.testResetSelectedIndex();

  runner.testValidate({
    testlabel: 'submitted data is valid',
    store: setupMockStore({
      dataset: {
        headers: [{ name: 'columnA' }],
        data: [],
      },
    }),
    props: {
      initialStepValue: {
        name: 'simplify',
        tolerance: 1,
      },
    },
  });
});
