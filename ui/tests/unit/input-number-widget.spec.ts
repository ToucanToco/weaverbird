import { mount, shallowMount } from '@vue/test-utils';

import InputNumberWidget from '@/components/stepforms/widgets/InputNumber.vue';

jest.mock('@/components/FAIcon.vue');

describe('Widget Input Number', () => {
  it('should instantiate', () => {
    const wrapper = shallowMount(InputNumberWidget);

    expect(wrapper.exists()).toBeTruthy();
  });

  it('should have a number input', () => {
    const wrapper = shallowMount(InputNumberWidget);

    expect(wrapper.find("input[type='number']").exists()).toBeTruthy();
  });

  it('should have an instantiated VariableInput', () => {
    const wrapper = shallowMount(InputNumberWidget);
    expect(wrapper.find('VariableInput-stub').exists()).toBeTruthy();
  });

  it('should not have a label if prop "name" is undefined', () => {
    const wrapper = shallowMount(InputNumberWidget);
    expect(wrapper.find('label').exists()).toBeFalsy();
  });

  it('should have a label if prop "name" is defined', () => {
    const wrapper = shallowMount(InputNumberWidget, { propsData: { name: 'Stark' } });
    const labelWrapper = wrapper.find('label');
    expect(labelWrapper.text()).toEqual('Stark');
  });

  it('should not have a hyperlink element if prop "docUrl" is undefined', () => {
    const wrapper = shallowMount(InputNumberWidget);
    expect(wrapper.find('a').exists()).toBeFalsy();
  });

  it('should have a hyperlink element if prop "docUrl" is defined', () => {
    const wrapper = shallowMount(InputNumberWidget, { propsData: { docUrl: 'testURL' } });
    const linkWrapper = wrapper.find('a');
    expect(wrapper.find('a').exists()).toBeTruthy();
    expect(linkWrapper.attributes().href).toEqual('testURL');
  });

  it('should have an empty placeholder', () => {
    const wrapper = shallowMount(InputNumberWidget, {
      propsData: {
        value: 'foo',
      },
    });
    const el = wrapper.find("input[type='number']").element as HTMLInputElement;

    expect(el.placeholder).toEqual('');
  });

  it('should have a placeholder', () => {
    const wrapper = shallowMount(InputNumberWidget, {
      propsData: {
        placeholder: 'I m a placeholder',
        value: 'foo',
      },
    });
    const el = wrapper.find("input[type='number']").element as HTMLInputElement;

    expect(el.placeholder).toEqual('I m a placeholder');
  });

  it('should have an empty input', () => {
    const wrapper = shallowMount(InputNumberWidget);
    const el = wrapper.find("input[type='number']").element as HTMLInputElement;

    expect(el.value).toEqual('');
  });

  it('should have a non empty input', () => {
    const wrapper = shallowMount(InputNumberWidget, {
      propsData: { value: 1 },
    });
    const el = wrapper.find("input[type='number']").element as HTMLInputElement;

    expect(el.value).toEqual('1');
  });

  it('should emit "input" event on update', () => {
    const wrapper = shallowMount(InputNumberWidget, {
      propsData: {
        value: 1,
      },
    });
    const inputWrapper = wrapper.find('input[type="number"]');
    (inputWrapper.element as HTMLInputElement).value = '2';
    inputWrapper.trigger('input', { value: '2' });
    expect(wrapper.emitted()).toEqual({ input: [[2]] });
  });

  it('should emit "input" event with the updated value when VariableInput is updated', () => {
    const wrapper = shallowMount(InputNumberWidget, {
      propsData: {
        value: 1,
      },
      sync: false,
    });
    wrapper
      .findAll('VariableInput-stub')
      .at(0)
      .vm.$emit('input', 2);
    expect(wrapper.emitted()).toEqual({ input: [[2]] });
  });

  it('should display an error message if messageError exists', () => {
    const wrapper = mount(InputNumberWidget, {
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
    const wrapper = mount(InputNumberWidget);
    expect(wrapper.find('.field__msg-error').exists()).toBeFalsy();
  });

  it('should display an warning message if messageError exists', () => {
    const wrapper = mount(InputNumberWidget, {
      propsData: {
        warning: 'warning',
      },
    });
    expect(wrapper.find('.field__msg-warning').exists()).toBeTruthy();
  });

  it('should not display a warning message if messageError does not exist', () => {
    const wrapper = mount(InputNumberWidget);
    expect(wrapper.find('.field__msg-warning').exists()).toBeFalsy();
  });
});
