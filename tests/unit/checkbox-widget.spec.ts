import { createLocalVue, mount, shallowMount } from '@vue/test-utils';

import CheckboxWidget from '@/components/stepforms/widgets/Checkbox.vue';

const localVue = createLocalVue();

describe('Widget Checkbox', () => {
  it('should instantiate', () => {
    const wrapper = shallowMount(CheckboxWidget);
    expect(wrapper.exists()).toBeTruthy();
  });

  it('should have a label', () => {
    const wrapper = shallowMount(CheckboxWidget, { propsData: { label: 'test' } });
    const labelWrapper = wrapper.find('label');
    expect(labelWrapper.text()).toEqual('test');
  });

  it('should toggle the right class on click', async () => {
    const wrapper = mount(CheckboxWidget, {
      propsData: { value: false },
    });
    expect(wrapper.classes()).not.toContain('widget-checkbox--checked');
    wrapper.trigger('click');
    await localVue.nextTick();
    expect(wrapper.classes()).toContain('widget-checkbox--checked');
    wrapper.trigger('click');
    await localVue.nextTick();
    expect(wrapper.classes()).not.toContain('.widget-checkbox--checked');
  });

  it('should emit "input" event on click', async () => {
    const wrapper = shallowMount(CheckboxWidget, {
      propsData: {
        value: false,
      },
    });
    wrapper.trigger('click');
    await localVue.nextTick();
    expect(wrapper.emitted()).toEqual({ input: [[true]] });
  });
});
