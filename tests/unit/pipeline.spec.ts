import { shallowMount } from '@vue/test-utils';
import Pipeline from '@/components/Pipeline.vue';

describe('Pipeline.vue', () => {
  it('renders steps', () => {
    const wrapper = shallowMount(Pipeline, {
      propsData: {
        steps: [{ name: 'filter' }, { name: 'rename' }, { name: 'group' }],
      },
    });
    const steps = wrapper.findAll('step-stub');
    expect(steps.length).toBe(3);
    const [step1, step2, step3] = steps.wrappers.map(stub => stub.props());
    expect(step1).toEqual({
      step: { name: 'filter' },
      isActive: false,
      isFirst: true,
      isLast: false,
    });
    expect(step2).toEqual({
      step: { name: 'rename' },
      isActive: false,
      isFirst: false,
      isLast: false,
    });
    expect(step3).toEqual({
      step: { name: 'group' },
      isActive: true,
      isFirst: false,
      isLast: true,
    });
  });
});
