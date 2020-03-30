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

  it('should be instantiated with the right class', async () => {
    const wrapper = mount(CheckboxWidget, {
      propsData: { value: false },
    });
    expect(wrapper.classes()).not.toContain('widget-checkbox--checked');
  });

  it('should be instantiated with the right class', async () => {
    const wrapper = mount(CheckboxWidget, {
      propsData: { value: true },
    });
    expect(wrapper.classes()).toContain('widget-checkbox--checked');
  });

  it('should emit the right value of "input" event on click', async () => {
    const wrapper = shallowMount(CheckboxWidget, {
      propsData: {
        value: false,
      },
    });
    wrapper.trigger('click');
    await localVue.nextTick();
    expect(wrapper.emitted()).toEqual({ input: [[true]] });
  });

  it('should emit the right value of "input" event on click', async () => {
    const wrapper = shallowMount(CheckboxWidget, {
      propsData: {
        value: true,
      },
    });
    wrapper.trigger('click');
    await localVue.nextTick();
    expect(wrapper.emitted()).toEqual({ input: [[false]] });
  });
});
