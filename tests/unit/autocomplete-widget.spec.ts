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
});
