import { mount, shallowMount } from '@vue/test-utils';
import Vue from 'vue';

import InputTextWidget from '@/components/stepforms/widgets/InputText.vue';

describe('Widget Input Text', () => {
  it('should instantiate', () => {
    const wrapper = shallowMount(InputTextWidget);

    expect(wrapper.exists()).toBeTruthy();
  });

  it('should have a text input', () => {
    const wrapper = shallowMount(InputTextWidget);

    expect(wrapper.find("input[type='text']").exists()).toBeTruthy();
  });

  it('should not have a label if prop "name" is undefined', () => {
    const wrapper = shallowMount(InputTextWidget);
    expect(wrapper.find('label').exists()).toBeFalsy();
  });

  it('should have a label if prop "name" is defined', () => {
    const wrapper = shallowMount(InputTextWidget, { propsData: { name: 'Stark' } });
    const labelWrapper = wrapper.find('label');
    expect(labelWrapper.text()).toEqual('Stark');
  });

  it('should not have a hyperlink element if prop "docUrl" is undefined', () => {
    const wrapper = shallowMount(InputTextWidget);
    expect(wrapper.find('a').exists()).toBeFalsy();
  });

  it('should have a hyperlink element if prop "docUrl" is defined', () => {
    const wrapper = shallowMount(InputTextWidget, { propsData: { docUrl: 'testURL' } });
    const linkWrapper = wrapper.find('a');
    expect(wrapper.find('a').exists()).toBeTruthy();
    expect(linkWrapper.attributes().href).toEqual('testURL');
  });

  it('should have an empty placeholder', () => {
    const wrapper = shallowMount(InputTextWidget, {
      propsData: {
        value: 'foo',
      },
    });
    const el = wrapper.find("input[type='text']").element as HTMLInputElement;

    expect(el.placeholder).toEqual('');
  });

  it('should have a placeholder', () => {
    const wrapper = shallowMount(InputTextWidget, {
      propsData: {
        placeholder: 'I m a placeholder',
        value: 'foo',
      },
    });
    const el = wrapper.find("input[type='text']").element as HTMLInputElement;

    expect(el.placeholder).toEqual('I m a placeholder');
  });

  it('should have an empty input', () => {
    const wrapper = shallowMount(InputTextWidget);
    const el = wrapper.find("input[type='text']").element as HTMLInputElement;

    expect(el.value).toEqual('');
  });

  it('should have a non empty input', () => {
    const wrapper = shallowMount(InputTextWidget, {
      propsData: { value: 'foo' },
    });
    const el = wrapper.find("input[type='text']").element as HTMLInputElement;

    expect(el.value).toEqual('foo');
  });

  it('should add the right class on focus', async () => {
    const wrapper = shallowMount(InputTextWidget, {
      propsData: { value: 'foo' },
    });
    const inputWrapper = wrapper.find("input[type='text']");
    inputWrapper.trigger('focus');
    await Vue.nextTick();

    expect(inputWrapper.classes()).toContain('widget-input-text--focused');
  });

  it('should emit "input" event on update', () => {
    const wrapper = shallowMount(InputTextWidget, {
      propsData: {
        value: 'Star',
      },
    });
    const inputWrapper = wrapper.find('input[type="text"]');
    (inputWrapper.element as HTMLInputElement).value = 'Stark';
    inputWrapper.trigger('input', { value: 'k' });
    expect(wrapper.emitted()).toEqual({ input: [['Stark']] });
  });

  it('should set / unset "isFocused" on focus / blur events', () => {
    const wrapper = shallowMount(InputTextWidget);
    const inputWrapper = wrapper.find('input[type="text"]');
    inputWrapper.trigger('focus');
    expect(wrapper.vm.$data.isFocused).toBeTruthy();
    inputWrapper.trigger('blur');
    expect(wrapper.vm.$data.isFocused).toBeFalsy();
  });

  it('should display an error message if messageError exists', () => {
    const wrapper = mount(InputTextWidget, {
      propsData: {
        dataPath: '.condition',
        errors: [
          {
            dataPath: '.condition',
            message: 'test error',
          },
        ],
      },
    });
    expect(wrapper.find('.field__msg-error').exists()).toBeTruthy();
  });

  it('should not display an error message if messageError does not exist', () => {
    const wrapper = mount(InputTextWidget);
    expect(wrapper.find('.field__msg-error').exists()).toBeFalsy();
  });

  it('should display an warning message if messageError exists', () => {
    const wrapper = mount(InputTextWidget, {
      propsData: {
        warning: 'warning',
      },
    });
    expect(wrapper.find('.field__msg-warning').exists()).toBeTruthy();
  });

  it('should not display a warning message if messageError does not exist', () => {
    const wrapper = mount(InputTextWidget);
    expect(wrapper.find('.field__msg-warning').exists()).toBeFalsy();
  });
});
