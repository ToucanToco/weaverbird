import { expect } from 'chai';
import { shallowMount } from '@vue/test-utils';
import WidgetAutocomplete from '@/components/stepforms/WidgetAutocomplete.vue';

describe('Widget Autocomplete', () => {
  it('should instantiate', () => {
    const wrapper = shallowMount(WidgetAutocomplete);
    expect(wrapper.exists()).to.be.true;
  });

  it('should have an instantiated Multiselect autocomplete', () => {
    const wrapper = shallowMount(WidgetAutocomplete);
    expect(wrapper.find('multiselect-stub').exists()).to.be.true;
  });
});
