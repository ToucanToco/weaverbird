import type { Wrapper } from '@vue/test-utils';
import { shallowMount } from '@vue/test-utils';
import { VTooltip } from 'v-tooltip';
import { beforeEach, describe, expect, it } from 'vitest';

import VariableTag from '@/components/stepforms/widgets/VariableInputs/VariableTag.vue';

describe('Variable Tag', () => {
  let wrapper: Wrapper<VariableTag>;

  beforeEach(() => {
    wrapper = shallowMount(VariableTag, {
      sync: false,
      directives: {
        tooltip: VTooltip,
      },
      propsData: {
        value: '{{ appRequesters.view }}',
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
        ],
      },
    });
  });

  it('should instantiate', () => {
    expect(wrapper.exists()).toBeTruthy();
  });

  it('should compute the variable identifier', () => {
    expect((wrapper as any).vm.variableIdentifier).toBe('appRequesters.view');
  });

  it('should compute the variable', () => {
    expect((wrapper as any).vm.variable).toStrictEqual({
      category: 'App variables',
      label: 'view',
      identifier: 'appRequesters.view',
      value: 'Product 123',
    });
  });

  it('should compute the variable value', () => {
    expect((wrapper as any).vm.variableValue).toBe('Product 123');
  });

  it('should display a tooltip on hover', () => {
    expect(wrapper.classes()).toContain('has-weaverbird__tooltip');
  });

  it('should display the tag label', () => {
    const name = wrapper.find('.widget-variable__tag-name');
    expect(name.exists()).toBe(true);
    expect(name.text()).toBe('view');
  });

  it('should display the remove button', () => {
    expect(wrapper.find('.widget-variable__tag-close').exists()).toBe(true);
  });

  it('should remove the tag when clicking on the remove button', async () => {
    const removeButton = wrapper.find('.widget-variable__tag-close');
    removeButton.trigger('mousedown');
    await wrapper.vm.$nextTick();
    expect(wrapper.emitted().removed).toBeTruthy();
  });

  it('should do nothing when clicking on the name', async () => {
    wrapper.find('.widget-variable__tag-name').trigger('mousedown');
    await wrapper.vm.$nextTick();
    expect(wrapper.emitted().edited).toBeFalsy();
  });

  describe('if the variable is an advanced variable', () => {
    beforeEach(() => {
      wrapper.setProps({
        value: '{{ toto }}',
      });
    });
    it('should display "AdVariable" as label', () => {
      expect((wrapper.vm as any).variableLabel).toBe('AdVariable');
      expect(wrapper.find('.widget-variable__tag-name').text()).toBe('AdVariable');
    });
    it('should display nothing instead of the human-friendly value', () => {
      expect((wrapper as any).vm.variableValue).toBe('');
    });
    it('should have specific style', () => {
      expect(wrapper.classes()).toContain('widget-variable__tag--advanced');
    });
    it('should edit advanced variable when clicking on the name', async () => {
      wrapper.find('.widget-variable__tag-name').trigger('mousedown');
      await wrapper.vm.$nextTick();
      expect(wrapper.emitted().edited).toBeTruthy();
    });
  });

  describe('if is a date variable', () => {
    beforeEach(() => {
      wrapper.setProps({
        isDate: true,
      });
    });
    it('should have specific style', () => {
      expect(wrapper.classes()).toContain('widget-variable__tag--date');
    });
    it('should have specific icon', () => {
      expect(wrapper.find('.widget-variable__tag-icon').text()).not.toBe('{}');
    });
    describe('if the variable is an advanced variable', () => {
      beforeEach(() => {
        wrapper.setProps({
          value: '{{ toto }}',
        });
      });
      it('should use identifier as label', () => {
        expect(wrapper.find('.widget-variable__tag-name').text()).toBe('toto');
      });
    });
  });
});
