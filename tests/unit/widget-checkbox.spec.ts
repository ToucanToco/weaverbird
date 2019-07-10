import { expect } from 'chai';
import { mount, createLocalVue, shallowMount } from '@vue/test-utils';
import WidgetCheckbox from '@/components/stepforms/WidgetCheckbox.vue';

const localVue = createLocalVue();

describe('Widget Checkbox', () => {
  it('should instantiate', () => {
    const wrapper = shallowMount(WidgetCheckbox);
    expect(wrapper.exists()).to.be.true;
  });

  it('should have a label', () => {
    const wrapper = shallowMount(WidgetCheckbox, { propsData: { label: 'test' } });
    const labelWrapper = wrapper.find('label');
    expect(labelWrapper.text()).to.equal('test');
  });

  it('should toggle the right class on click', async () => {
    const wrapper = mount(WidgetCheckbox, {
      propsData: { value: false },
    });
    expect(wrapper.classes()).not.to.contain('widget-checkbox--checked');
    wrapper.trigger('click');
    await localVue.nextTick();
    expect(wrapper.classes()).to.contain('widget-checkbox--checked');
    wrapper.trigger('click');
    await localVue.nextTick();
    expect(wrapper.classes()).not.to.contain('.widget-checkbox--checked');
  });

  it('should emit "input" event on click', async () => {
    const wrapper = shallowMount(WidgetCheckbox, {
      propsData: {
        value: false,
      },
    });
    wrapper.trigger('click');
    await localVue.nextTick();
    expect(wrapper.emitted()).to.eql({ input: [[true]] });
  });
});
