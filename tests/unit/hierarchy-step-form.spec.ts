import HierarchyStepForm from '@/components/stepforms/HierarchyStepForm.vue';

import { BasicStepFormTestRunner } from './utils';

jest.mock('@/components/FAIcon.vue');

describe('Hierarchy Step Form', () => {
  const runner = new BasicStepFormTestRunner(HierarchyStepForm, 'hierarchy');
  runner.testInstantiate();
  runner.testExpectedComponents({
    'inputtextwidget-stub': 1,
    'listwidget-stub': 1,
  });
  runner.testCancel();
  runner.testResetSelectedIndex();
});
