import ToDateStepForm from '@/components/stepforms/ToDateStepForm.vue';

import { BasicStepFormTestRunner } from './utils';

describe('Convert String to Date Step Form', () => {
  const runner = new BasicStepFormTestRunner(ToDateStepForm, 'todate');
  runner.testInstantiate();
  runner.testExpectedComponents(
    { 'columnpicker-stub': 1, 'inputtextwidget-stub': 0 },
    { translator: 'mongo36' },
  );
  runner.testExpectedComponents(
    { 'columnpicker-stub': 1, 'inputtextwidget-stub': 1 },
    { translator: 'mongo40' },
  );

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
