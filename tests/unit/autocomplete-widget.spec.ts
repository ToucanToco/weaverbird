import { shallowMount } from '@vue/test-utils';
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

  it('should have a label if prop "name" is defined', () => {
    const wrapper = shallowMount(AutocompleteWidget, { propsData: { name: 'foo' } });
    const labelWrapper = wrapper.find('label');
    expect(labelWrapper.text()).toEqual('foo');
  });

  it('should not have a label if prop "name" is undefined', () => {
    const wrapper = shallowMount(AutocompleteWidget);
    expect(wrapper.find('label').exists()).toBeFalsy();
  });
});
