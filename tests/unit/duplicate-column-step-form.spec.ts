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
      props: { initialStepValue: { name: 'duplicate', column: '', newColumn: '' } },
      errors: [
        { keyword: 'minLength', dataPath: '.column' },
        { keyword: 'minLength', dataPath: '.newColumn' },
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
      data: { editedStep: { name: 'duplicate', column: 'foo', newColumn: 'columnA' } },
      errors: [{ keyword: 'columnNameAlreadyUsed', dataPath: '.newColumn' }],
    },
  ]);

  runner.testValidate({
    testlabel: 'submitted data is valid',
    props: { initialStepValue: { name: 'duplicate', column: 'foo', newColumn: 'bar' } },
  });

  runner.testCancel({
    currentPipelineName: 'default_pipeline',
    pipelines: {
      default_pipeline: [
        { name: 'domain', domain: 'foo' },
        { name: 'rename', oldname: 'foo', newname: 'bar' },
      ],
    },
    selectedStepIndex: 1,
  });

  runner.testResetSelectedIndex();
});
