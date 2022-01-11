import { shallowMount, Wrapper } from '@vue/test-utils';

import VariableChooser from '@/components/stepforms/widgets/VariableInputs/VariableChooser.vue';

describe('Variable Chooser', () => {
  let wrapper: Wrapper<VariableChooser>;

  beforeEach(() => {
    wrapper = shallowMount(VariableChooser, {
      sync: false,
      propsData: {
        isOpened: false,
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
            category: 'App variables',
            label: 'date.today',
            identifier: 'appRequesters.date.today',
            value: new Date(1623398957013),
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
    });
  });

  it('should instantiate', () => {
    expect(wrapper.exists()).toBeTruthy();
  });

  it('should instantiate a popover', () => {
    expect(wrapper.find('popover-stub').exists()).toBeTruthy();
  });

  it('should instantiate a variable list', () => {
    expect(wrapper.find('VariableList-stub').exists()).toBeTruthy();
  });

  describe('when closing the popover', () => {
    beforeEach(async () => {
      wrapper.find('popover-stub').vm.$emit('closed');
      await wrapper.vm.$nextTick();
    });

    it('should emit close', () => {
      expect(wrapper.emitted().closed).toBeTruthy();
    });
  });

  describe('when choosing a variable', () => {
    beforeEach(async () => {
      wrapper.find('VariableList-stub').vm.$emit('input', 'appRequesters.view');
      await wrapper.vm.$nextTick();
    });

    it('should emit a new value with the chosen variable', () => {
      expect(wrapper.emitted('input')).toHaveLength(1);
      expect(wrapper.emitted('input')[0]).toEqual(['appRequesters.view']);
    });
  });

  describe('when choosing an advanced variable', () => {
    beforeEach(async () => {
      wrapper.find('VariableList-stub').vm.$emit('addAdvancedVariable');
      await wrapper.vm.$nextTick();
    });

    it('should emit advancedVariable', () => {
      expect(wrapper.emitted('addAdvancedVariable')).toHaveLength(1);
    });
  });
});
