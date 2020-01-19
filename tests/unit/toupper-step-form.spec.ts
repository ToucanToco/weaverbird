import ToUpperStepForm from '@/components/stepforms/ToUpperStepForm.vue';

import { BasicStepFormTestRunner } from './utils';

describe('To Uppercase Step Form', () => {
  const runner = new BasicStepFormTestRunner(ToUpperStepForm, 'uppercase');
  runner.testInstantiate();
  runner.testExpectedComponents({
    'columnpicker-stub': 1,
  });

  it('should display step column on edition', () => {
    const wrapper = runner.shallowMount(
      {},
      {
        propsData: {
          initialStepValue: { name: 'uppercase', column: 'foo' },
        },
      },
    );
    const columnPicker = wrapper.find('columnpicker-stub');
    expect(columnPicker.attributes('value')).toEqual('foo');
  });
});
