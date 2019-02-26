import { shallowMount } from '@vue/test-utils';
import Pipeline from '@/components/Pipeline.vue';

describe('Pipeline.vue', () => {
  it('renders steps', () => {
    const wrapper = shallowMount(Pipeline, {
      propsData: {
        steps: [{ name: 'domain' }, { name: 'rename' }, { name: 'group' }],
      },
    });
    const steps = wrapper.findAll('step-stub');
    // first step is the domain step and is processed separately by the
    // Pipeline component. There should only be the 2 generated <Step>
    // components.
    expect(steps.length).toBe(2);
    const [step1, step2] = steps.wrappers.map(stub => stub.props());
    expect(step1).toEqual({
      step: { name: 'rename' },
      isActive: false,
      isDisabled: false,
      isFirst: true,
      isLast: false,
      isDisabled: false,
    });
    expect(step2).toEqual({
      step: { name: 'group' },
      isActive: true,
      isDisabled: false,
      isFirst: false,
      isLast: true,
      isDisabled: false,
    });
  });
});
