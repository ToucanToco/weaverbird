import { shallowMount, Wrapper } from '@vue/test-utils';
import { VTooltip } from 'v-tooltip';

import VariableInput from '@/components/stepforms/widgets/VariableInput.vue';

describe('Variable Input', () => {
  let wrapper: Wrapper<VariableInput>;

  beforeEach(() => {
    wrapper = shallowMount(VariableInput, {
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
          {
            category: 'App variables',
            label: 'date.month',
            identifier: 'appRequesters.date.month',
            value: 'Apr',
          },
          {
            category: 'App variables',
            label: 'date.year',
            identifier: 'appRequesters.date.year',
            value: '2020',
          },
          {
            category: 'Story variables',
            label: 'country',
            identifier: 'requestersManager.country',
            value: '2020',
          },
          {
            category: 'Story variables',
            label: 'city',
            identifier: 'appRequesters.city',
            value: 'New York',
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

  describe('when value is not a variable', () => {
    beforeEach(() => {
      wrapper.setProps({ value: 'hummus' });
    });

    it('should display the regular input slot', () => {
      expect(wrapper.find('VariableInputBase-stub').exists()).toBe(true);
    });
  });

  describe('when value is a variable', () => {
    beforeEach(async () => {
      wrapper.setProps({
        value: '{{ hummus }}',
        variableDelimiters: { start: '{{', end: '}}' },
      });
      await wrapper.vm.$nextTick();
    });

    it('should not display the regular input slot', () => {
      expect(wrapper.find("input[type='text']").exists()).toBe(false);
    });

    it('should display the tag of the variable', () => {
      expect(wrapper.find('VariableTag-stub').exists()).toBe(true);
      expect(wrapper.find('VariableTag-stub').props().value).toBe('{{ hummus }}');
    });

    describe('when dismissing the variable', () => {
      beforeEach(async () => {
        wrapper.find('VariableTag-stub').vm.$emit('removed');
        await wrapper.vm.$nextTick();
      });

      it('should reset the value', () => {
        expect(wrapper.emitted('input')).toHaveLength(1);
        expect(wrapper.emitted('input')[0]).toEqual([undefined]);
      });
    });
  });

  describe('when editing an advanced variable', () => {
    beforeEach(async () => {
      wrapper.setProps({
        value: '{{ a }}',
        variableDelimiters: { start: '{{', end: '}}' },
      });
      await wrapper.vm.$nextTick();
    });
    it('should select the advanced variable to edit', async () => {
      wrapper.find('VariableTag-stub').vm.$emit('edited', '{{ a }}');
      await wrapper.vm.$nextTick();
      expect(wrapper.find('VariableInputBase-stub').props().editedAdvancedVariable).toBe('{{ a }}');
    });
  });

  it('should emit the new value when choosing a variable', async () => {
    wrapper.find('VariableInputBase-stub').vm.$emit('input', '{{ a }}');
    await wrapper.vm.$nextTick();
    expect(wrapper.emitted('input')).toHaveLength(1);
    expect(wrapper.emitted('input')[0]).toEqual(['{{ a }}']);
  });

  it('should emit the new value when choosing an advanced variable', async () => {
    wrapper.find('VariableInputBase-stub').vm.$emit('chooseAdvancedVariable', '{{ a }}');
    await wrapper.vm.$nextTick();
    expect(wrapper.emitted('input')).toHaveLength(1);
    expect(wrapper.emitted('input')[0]).toEqual(['{{ a }}']);
  });

  it('should reset the advanced variable to edit when modal close', async () => {
    wrapper.setData({ editedAdvancedVariable: '{{ a }}' });
    wrapper.find('VariableInputBase-stub').vm.$emit('resetEditedAdvancedVariable');
    await wrapper.vm.$nextTick();
    expect(wrapper.find('VariableInputBase-stub').props().editedAdvancedVariable).toBe('');
  });
});
