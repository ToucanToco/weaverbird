import FromDateStepForm from '@/components/stepforms/FromDateStepForm.vue';

import { BasicStepFormTestRunner } from './utils';

describe('Convert Date to String Step Form', () => {
  const runner = new BasicStepFormTestRunner(FromDateStepForm, 'fromdate');
  runner.testInstantiate();
  runner.testExpectedComponents({
    'columnpicker-stub': 1,
    'inputtextwidget-stub': 1,
  });

  it('should update editedStep with the selected column at creation', () => {
    const initialState = {
      dataset: {
        headers: [{ name: 'foo', type: 'string' }],
        data: [[null]],
      },
      selectedColumns: ['foo'],
    };
    const wrapper = runner.shallowMount(initialState);
    expect(wrapper.vm.$data.editedStep.column).toEqual('foo');
  });
});
