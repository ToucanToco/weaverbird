import { describe, expect, it, vi } from 'vitest';

import AbsoluteValueStepForm from '@/components/stepforms/AbsoluteValueStepForm.vue';

import { BasicStepFormTestRunner } from './utils';

vi.mock('@/components/FAIcon.vue');

describe('Absolute value step form', () => {
  const runner = new BasicStepFormTestRunner(AbsoluteValueStepForm, 'absolutevalue');
  runner.testInstantiate();
  runner.testExpectedComponents({
    'columnpicker-stub': 1,
    'inputtextwidget-stub': 1,
  });

  it('should pass down properties', async () => {
    const wrapper = runner.shallowMount();
    wrapper.setData({ editedStep: { name: 'absolutevalue', column: 'plop', newColumn: 'foo' } });
    await wrapper.vm.$nextTick();
    expect(wrapper.find('.newColumnInput').props('value')).toEqual('foo');
    expect(wrapper.find('.columnInput').props('value')).toEqual('plop');
  });
});
