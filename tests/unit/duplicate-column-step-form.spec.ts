import DuplicateColumnStepForm from '@/components/stepforms/DuplicateColumnStepForm.vue';

import { BasicStepFormTestRunner, setupMockStore } from './utils';

describe('Duplicate Column Step Form', () => {
  const runner = new BasicStepFormTestRunner(DuplicateColumnStepForm, 'duplicate');
  runner.testInstantiate();
  runner.testExpectedComponents({
    'columnpicker-stub': 1,
    'inputtextwidget-stub': 1,
  });

  runner.testValidationErrors([
    {
      testlabel: 'no submitted data',
      props: { initialStepValue: { name: 'duplicate', column: '', new_column_name: '' } },
      errors: [
        { keyword: 'minLength', dataPath: '.column' },
        { keyword: 'minLength', dataPath: '.new_column_name' },
      ],
    },
    {
      testlabel: 'existing column name',
      store: setupMockStore({
        dataset: {
          headers: [{ name: 'columnA' }, { name: 'columnB' }, { name: 'columnC' }],
          data: [],
        },
      }),
      data: { editedStep: { name: 'duplicate', column: 'foo', new_column_name: 'columnA' } },
      errors: [{ keyword: 'columnNameAlreadyUsed', dataPath: '.new_column_name' }],
    },
  ]);

  runner.testValidate({
    testlabel: 'submitted data is valid',
    props: { initialStepValue: { name: 'duplicate', column: 'foo', new_column_name: 'bar' } },
  });

  runner.testCancel({
    pipeline: [
      { name: 'domain', domain: 'foo' },
      { name: 'rename', oldname: 'foo', newname: 'bar' },
    ],
    selectedStepIndex: 1,
  });

  runner.testResetSelectedIndex();
});
