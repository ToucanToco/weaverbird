import { shallowMount } from '@vue/test-utils';
import WidgetInputText from '@/components/WidgetInputText.vue';

describe('Widget Input Text', () => {
  it('should instantiate', () => {
    const wrapper = shallowMount(WidgetInputText);

    expect(wrapper.exists()).toBeTruthy();
  });

  it('should have a text input', () => {
    const wrapper = shallowMount(WidgetInputText);

    expect(wrapper.find("input[type='text']").exists()).toBeTruthy();
  });

  it('should have an empty label', () => {
    const wrapper = shallowMount(WidgetInputText);
    const labelWrapper = wrapper.find('label');

    expect(labelWrapper.text()).toEqual('');
  });

  it('should have a label', () => {
    const wrapper = shallowMount(WidgetInputText, {
      propsData: {
        name: 'Stark',
      },
    });
    const labelWrapper = wrapper.find('label');

    expect(labelWrapper.text()).toEqual('Stark');
  });

  it('should have an empty placeholder', () => {
    const wrapper = shallowMount(WidgetInputText, {
      propsData: {
        value: 'foo',
      },
    });
    const el = wrapper.find("input[type='text']").element as HTMLInputElement;

    expect(el.placeholder).toEqual('');
  });

  it('should have a placeholder', () => {
    const wrapper = shallowMount(WidgetInputText, {
      propsData: {
        placeholder: 'I m a placeholder',
        value: 'foo',
      },
    });
    const el = wrapper.find("input[type='text']").element as HTMLInputElement;

    expect(el.placeholder).toEqual('I m a placeholder');
  });

  it('should have an empty input', () => {
    const wrapper = shallowMount(WidgetInputText);
    const el = wrapper.find("input[type='text']").element as HTMLInputElement;

    expect(el.value).toEqual('');
  });

  it('should have a non empty input', () => {
    const wrapper = shallowMount(WidgetInputText, {
      propsData: { value: 'foo' },
    });
    const el = wrapper.find("input[type='text']").element as HTMLInputElement;

    expect(el.value).toEqual('foo');
  });

  it('should add the right class on focus', () => {
    const wrapper = shallowMount(WidgetInputText, {
      propsData: { value: 'foo' },
    });
    const inputWrapper = wrapper.find("input[type='text']");
    inputWrapper.trigger('focus');

    expect(inputWrapper.classes()).toContain('widget-input-text--focused');
  });

  it('should emit "input" event on update', () => {
    const wrapper = shallowMount(WidgetInputText, {
      propsData: {
        value: 'Star',
      },
    });
    const inputWrapper = wrapper.find('input[type="text"]');
    (<HTMLInputElement>inputWrapper.element).value = 'Stark';
    inputWrapper.trigger('input', { value: 'k' });
    expect(wrapper.emitted()).toEqual({ input: [['Stark']] });
  });

  it('should set / unset "isFocused" on focus / blur events', () => {
    const wrapper = shallowMount(WidgetInputText);
    const inputWrapper = wrapper.find('input[type="text"]');
    inputWrapper.trigger('focus');
    expect(wrapper.vm.$data.isFocused).toBeTruthy();
    inputWrapper.trigger('blur');
    expect(wrapper.vm.$data.isFocused).toBeFalsy();
  });
});
