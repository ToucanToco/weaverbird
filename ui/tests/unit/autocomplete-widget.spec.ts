import { mount, shallowMount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import AutocompleteWidget from '@/components/stepforms/widgets/Autocomplete.vue';

describe('Widget Autocomplete', () => {
  it('should instantiate', () => {
    const wrapper = shallowMount(AutocompleteWidget);
    expect(wrapper.exists()).toBeTruthy();
  });

  it('should have an instantiated Multiselect autocomplete', () => {
    const wrapper = shallowMount(AutocompleteWidget);
    expect(wrapper.find('multiselect-stub').exists()).toBeTruthy();
  });

  it('should have an instantiated VariableInput', () => {
    const wrapper = shallowMount(AutocompleteWidget);
    expect(wrapper.find('VariableInput-stub').exists()).toBeTruthy();
  });

  it('should not have specific templates by default', () => {
    const wrapper = mount(AutocompleteWidget, {
      propsData: { options: ['foo', 'bar'] },
    });
    expect(wrapper.find('.option__title').exists()).toBeFalsy();
    expect(wrapper.find('.option__container').exists()).toBeFalsy();
  });

  it('should have specific templates a label is provided in options', () => {
    const wrapper = mount(AutocompleteWidget, {
      propsData: { options: [{ label: 'foo', example: 'bar' }] },
    });
    expect(wrapper.find('.option__title').exists()).toBeTruthy();
    expect(wrapper.find('.option__container').exists()).toBeTruthy();
  });

  it('should have a label if prop "name" is defined', () => {
    const wrapper = shallowMount(AutocompleteWidget, { propsData: { name: 'foo' } });
    const labelWrapper = wrapper.find('label');
    expect(labelWrapper.text()).toEqual('foo');
  });

  it('should not have a label if prop "name" is undefined', () => {
    const wrapper = shallowMount(AutocompleteWidget);
    expect(wrapper.find('label').exists()).toBeFalsy();
  });

  it('should emit "input" event with the updated value when multiselect is updated', () => {
    const wrapper = shallowMount(AutocompleteWidget, {
      propsData: {
        value: 'Mastercard',
      },
      sync: false,
    });
    wrapper.findAll('multiselect-stub').at(0).vm.$emit('input', 'Visa');
    expect(wrapper.emitted().input[0][0]).toEqual('Visa');
  });

  it('should emit "input" event with the updated value when VariableInput is updated', () => {
    const wrapper = shallowMount(AutocompleteWidget, {
      propsData: {
        value: 'Mastercard',
      },
      sync: false,
    });
    wrapper.findAll('VariableInput-stub').at(0).vm.$emit('input', 'Visa');
    expect(wrapper.emitted().input[0][0]).toEqual('Visa');
  });

  it('should add a tooltip to the option', () => {
    const wrapper = mount(AutocompleteWidget, {
      propsData: {
        options: [{ label: 'foo', example: 'bar', tooltip: 'ukulélé' }],
      },
    });
    expect(wrapper.find('.option__container').exists()).toBeTruthy();
    expect(wrapper.find('.option__container').attributes('title')).toEqual('ukulélé');
  });

  it('should add a title attribute to the title', () => {
    const wrapper = mount(AutocompleteWidget, {
      propsData: {
        options: [{ label: 'foo', example: 'bar' }],
      },
    });
    expect(wrapper.find('.option__title').exists()).toBeTruthy();
    expect(wrapper.find('.option__title').attributes('title')).toEqual('foo');
  });
});
