import { shallowMount } from '@vue/test-utils';
import Multiselect from 'vue-multiselect';

import AutocompleteWidget from '@/components/stepforms/widgets/Autocomplete.vue';

describe('Widget Autocomplete', () => {
  it('should instantiate passing the correct value to multiselect', () => {
    const wrapper = shallowMount(AutocompleteWidget, {
      propsData: {
        value: 'AAA',
        options: ['AAA', 'BBBB'],
      },
    });
    expect(wrapper.find(Multiselect).vm.$props.value).toEqual('AAA');
    expect(wrapper.find(Multiselect).vm.$props.options).toEqual(['AAA', 'BBBB']);
  });

  it('should emit new value', async () => {
    const wrapper = shallowMount(AutocompleteWidget, {
      propsData: {
        value: 'AAA',
        options: ['AAA', 'BBBB'],
      },
    });
    wrapper.find(Multiselect).vm.$emit('input', 'AAA');
    expect(wrapper.emitted().input[0][0]).toEqual('AAA');
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
