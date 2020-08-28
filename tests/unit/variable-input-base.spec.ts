import { shallowMount, Wrapper } from '@vue/test-utils';

import VariableInputBase from '@/components/stepforms/widgets/VariableInputs/VariableInputBase.vue';

describe('Variable Input', () => {
  let wrapper: Wrapper<VariableInputBase>;

  beforeEach(() => {
    wrapper = shallowMount(VariableInputBase, {
      sync: false,
      propsData: {
        variableDelimiters: { start: '{{', end: '}}' },
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

  it('should contain the advanced variable modal', () => {
    expect(wrapper.find('AdvancedVariableModal-stub').exists()).toBe(true);
  });

  describe('the variable (x) button', () => {
    it('should be present', () => {
      expect(wrapper.find('.widget-variable__toggle').exists()).toBe(true);
    });

    describe('when there is no available variables', () => {
      beforeEach(async () => {
        wrapper.setProps({
          availableVariables: [],
        });
        await wrapper.vm.$nextTick();
      });

      it('should not be present', () => {
        expect(wrapper.find('.widget-variable__toggle').exists()).toBe(false);
      });

      it('... except if advanced variable is allowed', async () => {
        wrapper.setProps({ advancedVariableDelimiters: { start: '{{', end: '}}' } });
        await wrapper.vm.$nextTick();
        expect(wrapper.find('.widget-variable__toggle').exists()).toBe(true);
      });
    });

    describe('when clicked', () => {
      beforeEach(async () => {
        wrapper.find('.widget-variable__toggle').trigger('click');
        await wrapper.vm.$nextTick();
      });

      it('should display the variable chooser', () => {
        expect(wrapper.find('VariableChooser-stub').props().isOpened).toBe(true);
      });

      it('should display the slot click handler', () => {
        expect(wrapper.find('.widget-variable__click-handler').exists()).toBe(true);
      });

      describe('when closing the popover', () => {
        beforeEach(async () => {
          wrapper.find('VariableChooser-stub').vm.$emit('closed');
          await wrapper.vm.$nextTick();
        });

        it('should hide the variable chooser', () => {
          expect(wrapper.find('VariableChooser-stub').props().isOpened).toBe(false);
        });

        it('should hide the slot click handler', () => {
          expect(wrapper.find('.widget-variable__click-handler').exists()).toBe(false);
        });
      });

      describe('when clicking on slot click handler', () => {
        beforeEach(async () => {
          wrapper.find('.widget-variable__click-handler').trigger('click');
          await wrapper.vm.$nextTick();
        });
        it('should hide the variable chooser', () => {
          expect(wrapper.find('VariableChooser-stub').props().isOpened).toBe(false);
        });

        it('should hide the slot click handler', () => {
          expect(wrapper.find('.widget-variable__click-handler').exists()).toBe(false);
        });
      });

      describe('when choosing a variable', () => {
        beforeEach(async () => {
          wrapper.find('VariableChooser-stub').vm.$emit('input', 'appRequesters.view');
          await wrapper.vm.$nextTick();
        });

        it('should emit a new value with the chosen variable', () => {
          expect(wrapper.emitted('input')).toHaveLength(1);
          expect(wrapper.emitted('input')[0]).toEqual(['{{ appRequesters.view }}']);
        });

        it('should hide the variable chooser', () => {
          expect(wrapper.find('VariableChooser-stub').props().isOpened).toBe(false);
        });
      });

      describe('when choosing a variable on multiple mode', () => {
        beforeEach(async () => {
          wrapper.setProps({ isMultiple: true });
          wrapper.find('VariableChooser-stub').vm.$emit('input', 'appRequesters.view');
          await wrapper.vm.$nextTick();
        });

        it('should keep the variable chooser open', () => {
          expect(wrapper.find('VariableChooser-stub').props().isOpened).toBe(true);
        });
      });

      describe('when choosing an advanced variable', () => {
        beforeEach(async () => {
          wrapper.find('VariableChooser-stub').vm.$emit('addAdvancedVariable');
          await wrapper.vm.$nextTick();
        });

        it('should hide the variable chooser', () => {
          expect(wrapper.find('VariableChooser-stub').props().isOpened).toBe(false);
        });

        it('should open the advanced variable modal', () => {
          expect(wrapper.find('AdvancedVariableModal-stub').props().isOpened).toBe(true);
        });

        it('... and close it on closed emit', async () => {
          wrapper.find('AdvancedVariableModal-stub').vm.$emit('closed');
          await wrapper.vm.$nextTick();
          expect(wrapper.find('AdvancedVariableModal-stub').props().isOpened).toBe(false);
        });

        it('... and emit value then close it on input emit', async () => {
          wrapper.find('AdvancedVariableModal-stub').vm.$emit('input', 'value');
          await wrapper.vm.$nextTick();
          expect(wrapper.find('AdvancedVariableModal-stub').props().isOpened).toBe(false);
          expect(wrapper.emitted('input')).toHaveLength(1);
          expect(wrapper.emitted('input')[0]).toEqual(['value']);
        });
      });
    });
  });

  describe('with a parent component which has an arrow', () => {
    beforeEach(() => {
      wrapper.setProps({ hasArrow: true });
    });
    it('should move the variable chooser toggle button away from arrow', () => {
      expect(wrapper.find('.widget-variable__toggle--parent-arrow').exists()).toBe(true);
    });
  });
});
