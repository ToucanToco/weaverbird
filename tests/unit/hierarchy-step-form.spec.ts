import HierarchyStepForm from '@/components/stepforms/HierarchyStepForm.vue';

import { BasicStepFormTestRunner, setupMockStore } from './utils';

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
        name: 'hierarchy',
        hierarchyLevelColumn: 'type',
        hierarchy: ['columnA'],
      },
    },
  });
});
