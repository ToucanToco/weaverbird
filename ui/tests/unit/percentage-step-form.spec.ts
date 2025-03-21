import { describe, expect, it, vi } from 'vitest';

import PercentageStepForm from '@/components/stepforms/PercentageStepForm.vue';

import { BasicStepFormTestRunner } from './utils';

vi.mock('@/components/FAIcon.vue');

describe('Percentage Step Form', () => {
  const runner = new BasicStepFormTestRunner(PercentageStepForm, 'percentage');
  runner.testInstantiate();
  runner.testExpectedComponents({
    'columnpicker-stub': 1,
    'multiselectwidget-stub': 1,
    'inputtextwidget-stub': 1,
  });
  runner.testValidationErrors([
    {
      testlabel: 'submitted data is not valid',
      errors: [{ keyword: 'minLength', dataPath: '.column' }],
    },
    {
      testlabel: 'existing column name',
      props: {
        columnTypes: { bar: 'string' },
      },
      data: { editedStep: { name: 'percentage', column: 'foo', newColumnName: 'bar' } },
      errors: [{ keyword: 'columnNameAlreadyUsed', dataPath: '.newColumnName' }],
    },
  ]);

  runner.testValidate({
    testlabel: 'submitted data is valid',
    props: {
      initialStepValue: { name: 'percentage', column: 'foo', group: ['test'] },
    },
  });

  runner.testCancel();

  it('should pass down the properties to the input components', async () => {
    const wrapper = runner.shallowMount({
      data: {
        editedStep: { name: 'percentage', column: 'foo', group: ['test'] },
      },
    });
    await wrapper.vm.$nextTick();
    expect(wrapper.find('multiselectwidget-stub').props('value')).toEqual(['test']);
  });

  it('should update step when selectedColumn is changed', async () => {
    const wrapper = runner.shallowMount({
      propsData: {
        columnTypes: { columnA: 'string', columnB: 'string', columnC: 'string' },
      },
    });
    expect(wrapper.vm.$data.editedStep.column).toEqual('');
    wrapper.setProps({ selectedColumns: ['columnB'] });
    await wrapper.vm.$nextTick();
    expect(wrapper.vm.$data.editedStep.column).toEqual('columnB');
  });
});
