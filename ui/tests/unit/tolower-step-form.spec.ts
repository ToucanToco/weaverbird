import { describe, expect, it, vi } from 'vitest';

import ToLowerStepForm from '@/components/stepforms/ToLowerStepForm.vue';

import { BasicStepFormTestRunner } from './utils';

vi.mock('@/components/FAIcon.vue');

describe('To Lowercase Step Form', () => {
  const runner = new BasicStepFormTestRunner(ToLowerStepForm, 'lowercase');
  runner.testInstantiate();
  runner.testExpectedComponents({
    'columnpicker-stub': 1,
  });

  it('should display step column on edition', () => {
    const wrapper = runner.shallowMount({
      propsData: {
        initialStepValue: { name: 'lowercase', column: 'foo' },
      },
    });
    const columnPicker = wrapper.find('columnpicker-stub');
    expect(columnPicker.attributes('value')).toEqual('foo');
  });
});
