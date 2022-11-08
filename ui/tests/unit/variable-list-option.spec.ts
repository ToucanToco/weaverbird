import type { Wrapper } from '@vue/test-utils';
import { shallowMount } from '@vue/test-utils';
import { VTooltip } from 'v-tooltip';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import VariableListOption from '@/components/stepforms/widgets/VariableInputs/VariableListOption.vue';

describe('Variable List option', () => {
  let wrapper: Wrapper<VariableListOption>;

  beforeEach(() => {
    wrapper = shallowMount(VariableListOption, {
      sync: false,
      directives: {
        tooltip: VTooltip,
      },
      propsData: {
        selectedVariables: '',
        value: 'Paris',
        label: 'City',
        identifier: 'appRequesters.city',
        togglable: false,
      },
    });
  });
  it('should instantiate', () => {
    expect(wrapper.exists()).toBeTruthy();
  });
  it('should display variable value', () => {
    expect(wrapper.find('.widget-variable-option__value').text()).toBe('Paris');
  });
  it('should display variable name', () => {
    expect(wrapper.find('.widget-variable-option__name').text()).toBe('City');
  });
  it('should display a value tooltip', () => {
    expect(wrapper.classes()).toContain('has-weaverbird__tooltip');
  });
  it('should not highlight option', () => {
    expect(wrapper.find('.widget-variable-option--selected').exists()).toBe(false);
  });
  it('should not display checkbox before name', () => {
    expect(wrapper.findAll('.widget-variable-option__toggle').exists()).toBe(false);
  });
  it('should emit the variable identifier when clicking on the variable', async () => {
    wrapper.trigger('click');
    await wrapper.vm.$nextTick();
    expect(wrapper.emitted('input')).toHaveLength(1);
    expect(wrapper.emitted('input')[0]).toEqual(['appRequesters.city']);
  });

  describe('togglable', () => {
    beforeEach(async () => {
      wrapper.setProps({ togglable: true });
      await wrapper.vm.$nextTick();
    });
    it('should display checkbox before name', () => {
      expect(wrapper.findAll('.widget-variable-option__toggle').exists()).toBe(true);
    });
  });

  describe('with date value', () => {
    beforeEach(async () => {
      wrapper.setProps({
        value: new Date(1623398957013),
      });
      await wrapper.vm.$nextTick();
    });
    it('should display date value with default toString', () => {
      expect(wrapper.find('.widget-variable-option__value').text()).toBe(
        new Date(1623398957013).toString(),
      );
    });
  });

  describe('when option is selected', () => {
    beforeEach(async () => {
      wrapper.setProps({
        selectedVariables: 'appRequesters.city',
      });
      await wrapper.vm.$nextTick();
    });
    it('should highlight option', () => {
      expect(wrapper.find('.widget-variable-option--selected').exists()).toBe(true);
    });
  });

  describe('when option is selected (with multiple variables)', () => {
    beforeEach(async () => {
      wrapper.setProps({
        selectedVariables: ['appRequesters.city'],
      });
      await wrapper.vm.$nextTick();
    });
    it('should highlight option', () => {
      expect(wrapper.find('.widget-variable-option--selected').exists()).toBe(true);
    });
  });

  describe('when showOnlyLabel', () => {
    beforeEach(async () => {
      wrapper.setProps({
        showOnlyLabel: true,
      });
      await wrapper.vm.$nextTick();
    });
    it('should hide variable value', () => {
      expect(wrapper.find('.widget-variable-option__value').exists()).toBe(false);
    });
    it('should hide value tooltip', () => {
      expect((wrapper.vm as any).readableValue).toStrictEqual('');
    });
  });

  describe('tooltip', () => {
    [
      { type: 'array', value: [1, 2], attendedValue: '[1,2]' },
      { type: 'empty array', value: [], attendedValue: '[]' },
      { type: 'number', value: 1, attendedValue: '1' },
      { type: 'string', value: '1', attendedValue: '"1"' },
      { type: 'undefined', value: undefined, attendedValue: undefined },
      {
        type: 'date',
        value: new Date(1623398957013),
        attendedValue: `"${new Date(1623398957013).toString()}"`,
      },
    ].forEach(
      ({ type, value, attendedValue }: { type: string; value: any; attendedValue: any }) => {
        describe(`with ${type} value`, () => {
          beforeEach(async () => {
            wrapper.setProps({ value });
            await wrapper.vm.$nextTick();
          });
          it('should display readable value in tooltip', () => {
            expect((wrapper.vm as any).readableValue).toStrictEqual(attendedValue);
          });
        });
      },
    );
  });
});

describe('Variable List option - empty', () => {
  let wrapper: Wrapper<VariableListOption>;
  beforeEach(() => {
    wrapper = shallowMount(VariableListOption, {
      sync: false,
      propsData: {},
    });
  });
  afterEach(() => {
    wrapper.destroy();
  });
  it('should set selectedVariables default to empty string', () => {
    expect((wrapper.vm as any).selectedVariables).toStrictEqual('');
  });
});
