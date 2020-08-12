import { shallowMount, Wrapper } from '@vue/test-utils';
import { VTooltip } from 'v-tooltip';

import MultiVariableInput from '@/components/stepforms/widgets/MultiVariableInput.vue';

describe('Variable Input', () => {
  let wrapper: Wrapper<MultiVariableInput>;

  beforeEach(() => {
    wrapper = shallowMount(MultiVariableInput, {
      sync: false,
      directives: {
        tooltip: VTooltip,
      },
      propsData: {
        availableVariables: [
          {
            category: 'App variables',
            label: 'view',
            identifier: 'appRequesters.view',
            value: 'Product 123',
          },
        ],
      },
      slots: {
        default: '<input type="text"/>',
      },
    });
  });

  it('should instantiate', () => {
    expect(wrapper.exists()).toBeTruthy();
  });

  it('should contain the input in the default slot', () => {
    expect(wrapper.find("input[type='text']").exists()).toBe(true);
  });

  it('should contain the variable input base', () => {
    expect(wrapper.find('VariableInputBase-stub').exists()).toBe(true);
  });

  describe('when choosing a variable', () => {
    it('should add the value to the list ...', async () => {
      wrapper.find('VariableInputBase-stub').vm.$emit('input', 'appRequesters.view');
      await wrapper.vm.$nextTick();
      expect(wrapper.emitted('input')).toHaveLength(1);
      expect(wrapper.emitted('input')[0][0]).toEqual(['{{ appRequesters.view }}']);
    });

    it('... or remove it if already in', async () => {
      wrapper.setProps({ value: ['{{ appRequesters.view }}'] });
      wrapper.find('VariableInputBase-stub').vm.$emit('input', 'appRequesters.view');
      await wrapper.vm.$nextTick();
      expect(wrapper.emitted('input')).toHaveLength(1);
      expect(wrapper.emitted('input')[0][0]).toEqual([]);
    });
  });
});
