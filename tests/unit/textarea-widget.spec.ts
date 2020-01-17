import { mount, shallowMount } from '@vue/test-utils';
import Vue from 'vue';

import TextareaWidget from '@/components/stepforms/widgets/TextareaWidget.vue';

describe('Widget Textarea', () => {
  it('should instantiate', () => {
    const wrapper = shallowMount(TextareaWidget);

    expect(wrapper.exists()).toBeTruthy();
  });

  it('should have a text textarea', () => {
    const wrapper = shallowMount(TextareaWidget);

    expect(wrapper.find("textarea[type='text']").exists()).toBeTruthy();
  });

  it('should not have a label if prop "name" is undefined', () => {
    const wrapper = shallowMount(TextareaWidget);
    expect(wrapper.find('label').exists()).toBeFalsy();
  });

  it('should have a label if prop "name" is defined', () => {
    const wrapper = shallowMount(TextareaWidget, { propsData: { name: 'Stark' } });
    const labelWrapper = wrapper.find('label');
    expect(labelWrapper.text()).toEqual('Stark');
  });

  it('should have an empty placeholder', () => {
    const wrapper = shallowMount(TextareaWidget, {
      propsData: {
        value: 'foo',
      },
    });
    const el = wrapper.find("textarea[type='text']").element as HTMLTextareaElement;

    expect(el.placeholder).toEqual('');
  });

  it('should have a placeholder', () => {
    const wrapper = shallowMount(TextareaWidget, {
      propsData: {
        placeholder: 'I m a placeholder',
        value: 'foo',
      },
    });
    const el = wrapper.find("textarea[type='text']").element as HTMLTextareaElement;

    expect(el.placeholder).toEqual('I m a placeholder');
  });

  it('should have an empty textarea', () => {
    const wrapper = shallowMount(TextareaWidget);
    const el = wrapper.find("textarea[type='text']").element as HTMLTextareaElement;

    expect(el.value).toEqual('');
  });

  it('should have a non empty textarea', () => {
    const wrapper = shallowMount(TextareaWidget, {
      propsData: { value: 'foo' },
    });
    const el = wrapper.find("textarea[type='text']").element as HTMLTextareaElement;

    expect(el.value).toEqual('foo');
  });

  it('should add the right class on focus', async () => {
    const wrapper = shallowMount(TextareaWidget, {
      propsData: { value: 'foo' },
    });
    const textareaWrapper = wrapper.find("textarea[type='text']");
    textareaWrapper.trigger('focus');
    await Vue.nextTick();

    expect(textareaWrapper.classes()).toContain('widget-textarea-text--focused');
  });

  it('should emit "textarea" event on update', () => {
    const wrapper = shallowMount(TextareaWidget, {
      propsData: {
        value: 'Star',
      },
    });
    const textareaWrapper = wrapper.find('textarea[type="text"]');
    (textareaWrapper.element as HTMLTextareaElement).value = 'Stark';
    textareaWrapper.trigger('textarea', { value: 'k' });
    expect(wrapper.emitted()).toEqual({ textarea: [['Stark']] });
  });

  it('should set / unset "isFocused" on focus / blur events', () => {
    const wrapper = shallowMount(TextareaWidget);
    const textareaWrapper = wrapper.find('textarea[type="text"]');
    textareaWrapper.trigger('focus');
    expect(wrapper.vm.$data.isFocused).toBeTruthy();
    textareaWrapper.trigger('blur');
    expect(wrapper.vm.$data.isFocused).toBeFalsy();
  });

  it('should display an error message if messageError exists', () => {
    const wrapper = mount(TextareaWidget, {
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
    const wrapper = mount(TextareaWidget);
    expect(wrapper.find('.field__msg-error').exists()).toBeFalsy();
  });

  it('should display an warning message if messageError exists', () => {
    const wrapper = mount(TextareaWidget, {
      propsData: {
        warning: 'warning',
      },
    });
    expect(wrapper.find('.field__msg-warning').exists()).toBeTruthy();
  });

  it('should not display a warning message if messageError does not exist', () => {
    const wrapper = mount(TextareaWidget);
    expect(wrapper.find('.field__msg-warning').exists()).toBeFalsy();
  });
});
