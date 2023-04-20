import type { Wrapper } from '@vue/test-utils';
import { shallowMount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import VariableInputBase from '@/components/stepforms/widgets/VariableInputs/VariableInputBase.vue';

describe('Variable Input', () => {
  let wrapper: Wrapper<VariableInputBase>;

  beforeEach(() => {
    wrapper = shallowMount(VariableInputBase, {
      sync: false,
      propsData: {
        variableDelimiters: { start: '{{', end: '}}' },
        trustedVariableDelimiters: { start: '<<', end: '>>' },
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
          {
            category: 'Server variables',
            label: 'server',
            identifier: 'server.data',
            value: 'Data from server',
            trusted: true,
          },
        ],
        value: '{{ appRequesters.city }}',
      },
      slots: {
        default: '<input type="text"/>',
      },
    });
  });

  afterEach(() => {
    wrapper.destroy();
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

  it('should pass selectedVariable without delimiters to variable chooser', () => {
    expect(wrapper.find('VariableChooser-stub').props().selectedVariables).toStrictEqual(
      'appRequesters.city',
    );
  });

  describe('with multiple selected variables', () => {
    beforeEach(async () => {
      wrapper.setProps({
        value: [
          '{{ appRequesters.city }}',
          '{{ appRequesters.country }}',
          '<< server.data >>',
          'toto',
        ],
      });
      await wrapper.vm.$nextTick();
    });

    it('should pass selectedVariables without delimiters to variable chooser', () => {
      expect(wrapper.find('VariableChooser-stub').props().selectedVariables).toStrictEqual([
        'appRequesters.city',
        'appRequesters.country',
        'server.data',
        // toto is a simple string not a variable so keep it unchanged
        'toto',
      ]);
    });
  });

  describe('the variable (x) button', () => {
    it('should be present', () => {
      expect(wrapper.find('.widget-variable__toggle').exists()).toBe(true);
    });

    describe('when there is no available variables', () => {
      beforeEach(async () => {
        wrapper.setProps({
          availableVariables: null,
        });
        await wrapper.vm.$nextTick();
      });

      it('should not be present', () => {
        expect(wrapper.find('.widget-variable__toggle').exists()).toBe(false);
      });

      it('... except if availableVariables is not null', async () => {
        wrapper.setProps({ availableVariables: [] });
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
          wrapper
            .find('VariableChooser-stub')
            .vm.$emit('input', ['appRequesters.view', 'appRequesters.city', 'server.data', 'toto']);
          await wrapper.vm.$nextTick();
        });

        it('should keep the variable chooser open', () => {
          expect(wrapper.find('VariableChooser-stub').props().isOpened).toBe(true);
        });

        it('should emit a new values with the chosen variables', () => {
          expect(wrapper.emitted('input')).toHaveLength(1);
          expect(wrapper.emitted('input')[0]).toEqual([
            [
              '{{ appRequesters.view }}',
              '{{ appRequesters.city }}',
              '<< server.data >>',
              // toto is a simple string not a variable so keep it unchanged
              'toto',
            ],
          ]);
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
      });

      describe('when closing the advanced variable modal', () => {
        beforeEach(async () => {
          wrapper.find('AdvancedVariableModal-stub').vm.$emit('closed');
          await wrapper.vm.$nextTick();
        });

        it('should close the modal', () => {
          expect(wrapper.find('AdvancedVariableModal-stub').props().isOpened).toBe(false);
        });

        it('should reset the selected advanced variable to edit', () => {
          expect(wrapper.emitted('resetEditedAdvancedVariable')).toHaveLength(1);
        });
      });

      describe('when saving an advanced variable', () => {
        beforeEach(async () => {
          wrapper.find('AdvancedVariableModal-stub').vm.$emit('input', 'Test');
          await wrapper.vm.$nextTick();
        });

        it('should emit the new value with delimiters', () => {
          expect(wrapper.emitted('chooseAdvancedVariable')).toHaveLength(1);
          expect(wrapper.emitted('chooseAdvancedVariable')[0]).toEqual(['{{ Test }}']);
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

  describe('when selecting an advanced variable to edit', () => {
    it('should open the advanced variable modal', async () => {
      wrapper.setProps({ editedAdvancedVariable: '{{ a }}' });
      await wrapper.vm.$nextTick();
      expect(wrapper.find('AdvancedVariableModal-stub').props().isOpened).toBe(true);
    });
  });
});
