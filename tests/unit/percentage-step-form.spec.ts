import PercentageStepForm from '@/components/stepforms/PercentageStepForm.vue';
import { VQBnamespace } from '@/store';

import { BasicStepFormTestRunner, setupMockStore } from './utils';

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
      store: setupMockStore({
        dataset: {
          headers: [{ name: 'bar' }],
          data: [],
        },
      }),
      data: { editedStep: { name: 'percentage', column: 'foo', newColumn: 'bar' } },
      errors: [{ keyword: 'columnNameAlreadyUsed', dataPath: '.newColumn' }],
    },
  ]);

  runner.testValidate({
    testlabel: 'submitted data is valid',
    props: {
      initialStepValue: { name: 'percentage', column: 'foo', group: ['test'] },
    },
  });

  runner.testCancel();
  runner.testResetSelectedIndex();

  it('should pass down the properties to the input components', async () => {
    const wrapper = runner.shallowMount(undefined, {
      data: {
        editedStep: { name: 'percentage', column: 'foo', group: ['test'] },
      },
    });
    await wrapper.vm.$nextTick();
    expect(wrapper.find('multiselectwidget-stub').props('value')).toEqual(['test']);
  });

  it('should update step when selectedColumn is changed', async () => {
    const initialState = {
      dataset: {
        headers: [{ name: 'columnA' }, { name: 'columnB' }, { name: 'columnC' }],
        data: [],
      },
    };
    const wrapper = runner.shallowMount(initialState);
    expect(wrapper.vm.$data.editedStep.column).toEqual('');
    wrapper.vm.$store.commit(VQBnamespace('toggleColumnSelection'), { column: 'columnB' });
    await wrapper.vm.$nextTick();
    expect(wrapper.vm.$data.editedStep.column).toEqual('columnB');
  });
});
