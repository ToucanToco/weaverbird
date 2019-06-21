import { expect } from 'chai';
import { shallowMount } from '@vue/test-utils';
import Vue from 'vue';
import WidgetInputText from '@/components/stepforms/WidgetInputText.vue';

describe('Widget Input Text', () => {
  it('should instantiate', () => {
    const wrapper = shallowMount(WidgetInputText);

    expect(wrapper.exists()).to.be.true;
  });

  it('should have a text input', () => {
    const wrapper = shallowMount(WidgetInputText);

    expect(wrapper.find("input[type='text']").exists()).to.be.true;
  });

  it('should have an empty label', () => {
    const wrapper = shallowMount(WidgetInputText);
    const labelWrapper = wrapper.find('label');

    expect(labelWrapper.text()).to.equal('');
  });

  it('should have a label', () => {
    const wrapper = shallowMount(WidgetInputText, {
      propsData: {
        name: 'Stark',
      },
    });
    const labelWrapper = wrapper.find('label');

    expect(labelWrapper.text()).to.equal('Stark');
  });

  it('should have an empty placeholder', () => {
    const wrapper = shallowMount(WidgetInputText, {
      propsData: {
        value: 'foo',
      },
    });
    const el = wrapper.find("input[type='text']").element as HTMLInputElement;

    expect(el.placeholder).to.equal('');
  });

  it('should have a placeholder', () => {
    const wrapper = shallowMount(WidgetInputText, {
      propsData: {
        placeholder: 'I m a placeholder',
        value: 'foo',
      },
    });
    const el = wrapper.find("input[type='text']").element as HTMLInputElement;

    expect(el.placeholder).to.equal('I m a placeholder');
  });

  it('should have an empty input', () => {
    const wrapper = shallowMount(WidgetInputText);
    const el = wrapper.find("input[type='text']").element as HTMLInputElement;

    expect(el.value).to.equal('');
  });

  it('should have a non empty input', () => {
    const wrapper = shallowMount(WidgetInputText, {
      propsData: { value: 'foo' },
    });
    const el = wrapper.find("input[type='text']").element as HTMLInputElement;

    expect(el.value).to.equal('foo');
  });

  it('should add the right class on focus', async () => {
    const wrapper = shallowMount(WidgetInputText, {
      propsData: { value: 'foo' },
    });
    const inputWrapper = wrapper.find("input[type='text']");
    inputWrapper.trigger('focus');
    await Vue.nextTick();

    expect(inputWrapper.classes()).to.contain('widget-input-text--focused');
  });

  it('should emit "input" event on update', () => {
    const wrapper = shallowMount(WidgetInputText, {
      propsData: {
        value: 'Star',
      },
    });
    const inputWrapper = wrapper.find('input[type="text"]');
    (inputWrapper.element as HTMLInputElement).value = 'Stark';
    inputWrapper.trigger('input', { value: 'k' });
    expect(wrapper.emitted()).to.eql({ input: [['Stark']] });
  });

  it('should set / unset "isFocused" on focus / blur events', () => {
    const wrapper = shallowMount(WidgetInputText);
    const inputWrapper = wrapper.find('input[type="text"]');
    inputWrapper.trigger('focus');
    expect(wrapper.vm.$data.isFocused).to.be.true;
    inputWrapper.trigger('blur');
    expect(wrapper.vm.$data.isFocused).to.be.false;
  });
});
