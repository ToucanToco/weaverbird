import CustomSqlStepForm from '@/components/stepforms/CustomSqlStepForm.vue';

import { BasicStepFormTestRunner } from './utils';

jest.mock('@/components/FAIcon.vue');

describe('Custom sql Step Form', () => {
  const runner = new BasicStepFormTestRunner(CustomSqlStepForm, 'customsql');
  runner.testInstantiate();
  runner.testExpectedComponents({
    'codeeditorwidget-stub': 1,
  });
  runner.testValidationErrors([
    {
      testlabel: 'submitted query should not be empty',
      props: {
        initialStepValue: {
          name: 'customsql',
          query: '',
        },
      },
      errors: [{ dataPath: '.query', keyword: 'minLength' }],
    },
    {
      testlabel: 'submitted query does not contain select',
      props: {
        initialStepValue: {
          name: 'customsql',
          query: 'SHOW TABLES;',
        },
      },
      errors: [{ dataPath: '.query', keyword: 'sql' }],
    },
  ]);
  runner.testValidate({
    testlabel: 'submitted query is valid',
    props: {
      initialStepValue: {
        name: 'customsql',
        query: 'SELECT * FROM ##PREVIOUS_STEP##;',
      },
    },
  });
});
