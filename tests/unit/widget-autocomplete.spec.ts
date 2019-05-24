import { shallowMount } from '@vue/test-utils';
import WidgetAutocomplete from '@/components/WidgetAutocomplete.vue';

describe('Widget Autocomplete', () => {
  it('should instantiate', () => {
    const wrapper = shallowMount(WidgetAutocomplete);
    expect(wrapper.exists()).toBeTruthy();
  });

  it('should have an instantiated Multiselect autocomplete', () => {
    const wrapper = shallowMount(WidgetAutocomplete);
    expect(wrapper.find('multiselect-stub').exists()).toBeTruthy();
  });
});
