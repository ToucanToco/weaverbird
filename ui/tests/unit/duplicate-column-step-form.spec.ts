import { describe, vi } from 'vitest';

import DuplicateColumnStepForm from '@/components/stepforms/DuplicateColumnStepForm.vue';

import { BasicStepFormTestRunner } from './utils';

vi.mock('@/components/FAIcon.vue');

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
      props: {
        columnTypes: { columnA: 'string', columnB: 'string', columnC: 'string' },
        initialStepValue: { name: 'duplicate', column: '', newColumnName: '' },
      },
      errors: [
        { keyword: 'minLength', dataPath: '.column' },
        { keyword: 'minLength', dataPath: '.newColumnName' },
      ],
    },
    {
      testlabel: 'existing column name',
      data: { editedStep: { name: 'duplicate', column: 'foo', newColumnName: 'columnA' } },
      errors: [{ keyword: 'columnNameAlreadyUsed', dataPath: '.newColumnName' }],
    },
  ]);

  runner.testValidate({
    testlabel: 'submitted data is valid',
    props: { initialStepValue: { name: 'duplicate', column: 'foo', newColumnName: 'bar' } },
  });

  runner.testCancel({
    currentPipelineName: 'default_pipeline',
    pipelines: {
      default_pipeline: [
        { name: 'domain', domain: 'foo' },
        { name: 'rename', toRename: [['foo', 'bar']] },
      ],
    },
    selectedStepIndex: 1,
  });

  runner.testResetSelectedIndex();
});
