import { mount, shallowMount } from '@vue/test-utils';

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

  it('should not have specific templates if the prop withExample is false', () => {
    const wrapper = mount(AutocompleteWidget, {
      propsData: { withExample: false, options: [{ label: 'foo', example: 'bar' }] },
    });
    expect(wrapper.find('.option__title').exists()).toBeFalsy();
    expect(wrapper.find('.option__container').exists()).toBeFalsy();
  });

  it('should have specific templates if the prop withExample is true', () => {
    const wrapper = mount(AutocompleteWidget, {
      propsData: { withExample: true, options: [{ label: 'foo', example: 'bar' }] },
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
    wrapper
      .findAll('multiselect-stub')
      .at(0)
      .vm.$emit('input', 'Visa');
    expect(wrapper.emitted().input[0][0]).toEqual('Visa');
  });
});
