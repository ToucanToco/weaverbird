import { shallowMount } from '@vue/test-utils';
import WidgetMultiSelect from '@/components/stepforms/WidgetInputText.vue';

describe('Widget Multiselect', () => {
  it('should instantiate', () => {
    const wrapper = shallowMount(WidgetMultiSelect);

    expect(wrapper.exists()).toBeTruthy();
  });

  it('should have a label', () => {
    const wrapper = shallowMount(WidgetMultiSelect, {
      propsData: {
        name: 'Stark',
      },
    });
    const labelWrapper = wrapper.find('label');
    expect(labelWrapper.text()).toEqual('Stark');
  });

  it('should have an empty placeholder', () => {
    const wrapper = shallowMount(WidgetMultiSelect, {
      propsData: {
        value: 'foo',
      },
    });
    const el = wrapper.find("input[type='text']").element as HTMLInputElement;
    expect(el.placeholder).toEqual('');
  });

  it('should have a placeholder', () => {
    const wrapper = shallowMount(WidgetMultiSelect, {
      propsData: {
        placeholder: 'I m a placeholder',
        value: 'foo',
      },
    });
    const el = wrapper.find("input[type='text']").element as HTMLInputElement;
    expect(el.placeholder).toEqual('I m a placeholder');
  });

  it('should have an empty input', () => {
    const wrapper = shallowMount(WidgetMultiSelect);
    const el = wrapper.find("input[type='text']").element as HTMLInputElement;
    expect(el.value).toEqual('');
  });

  it('should have a non empty input', () => {
    const wrapper = shallowMount(WidgetMultiSelect, {
      propsData: { value: 'foo' },
    });
    const el = wrapper.find("input[type='text']").element as HTMLInputElement;
    expect(el.value).toEqual('foo');
  });

  it('should emit "input" event on update', () => {
    const wrapper = shallowMount(WidgetMultiSelect, {
      propsData: {
        value: ['Foo'],
      },
    });
    const inputWrapper = wrapper.find('input[type="text"]');
    (inputWrapper.element as HTMLInputElement).value = 'Bar';
    inputWrapper.trigger('input', { value: 'Bar' });
    expect(wrapper.emitted()).toEqual({ input: [['Bar']] });
  });
});
