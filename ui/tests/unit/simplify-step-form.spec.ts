import { describe, vi } from 'vitest';

import SimplifyStepForm from '@/components/stepforms/SimplifyStepForm.vue';

import { BasicStepFormTestRunner } from './utils';

vi.mock('@/components/FAIcon.vue');

describe('Simplify Step Form', () => {
  const runner = new BasicStepFormTestRunner(SimplifyStepForm, 'simplify');
  runner.testInstantiate();
  runner.testExpectedComponents({
    'inputnumberwidget-stub': 1,
  });
  runner.testCancel();

  runner.testValidate({
    testlabel: 'submitted data is valid',
    props: {
      columnTypes: { columnA: 'string' },
      initialStepValue: {
        name: 'simplify',
        tolerance: 1,
      },
    },
  });
});
