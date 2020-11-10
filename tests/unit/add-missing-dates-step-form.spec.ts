import AddMissingDatesStepForm from '@/components/stepforms/AddMissingDatesStepForm.vue';

import { BasicStepFormTestRunner } from './utils';

describe('Evolution Step Form', () => {
  const runner = new BasicStepFormTestRunner(AddMissingDatesStepForm, 'addmissingdates');
  runner.testInstantiate();
  runner.testExpectedComponents({
    'columnpicker-stub': 1,
    'autocompletewidget-stub': 1,
    'multiselectwidget-stub': 1,
  });
  runner.testValidate({
    testlabel: 'submitted data is valid',
    props: {
      initialStepValue: {
        name: 'addmissingdates',
        datesColumn: 'DATE',
        datesGranularity: 'day',
        groups: ['COUNTRY'],
      },
    },
  });
  runner.testValidationErrors([
    {
      testlabel: 'empty dates column name',
      errors: [{ keyword: 'minLength', dataPath: '.datesColumn' }],
    },
    {
      testlabel: 'empty group column name',
      data: {
        editedStep: {
          name: 'addmissingdates',
          datesColumn: 'DATE',
          datesGranularity: 'day',
          groups: [''],
        },
      },
      errors: [{ keyword: 'minLength', dataPath: '.groups[0]' }],
    },
  ]);

  it('should pass down props to widgets', async () => {
    const wrapper = runner.shallowMount(undefined, {
      data: {
        editedStep: {
          name: 'addmissingdates',
          datesColumn: 'DATE',
          datesGranularity: 'month',
          groups: ['COUNTRY'],
        },
      },
    });
    await wrapper.vm.$nextTick();
    expect(wrapper.find('.datesColumnInput').props('value')).toEqual('DATE');
    expect(wrapper.find('.datesGranularityInput').props('value')).toEqual('month');
    expect(wrapper.find('.groupsInput').props('value')).toEqual(['COUNTRY']);
  });
});
