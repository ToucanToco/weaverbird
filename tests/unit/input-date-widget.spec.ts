import { mount, shallowMount } from '@vue/test-utils';

import InputDateWidget from '@/components/stepforms/widgets/InputDate.vue';

describe('Widget Input Text', () => {
  it('should instantiate', () => {
    const wrapper = shallowMount(InputDateWidget);

    expect(wrapper.exists()).toBeTruthy();
  });

  it('should have a date input', () => {
    const wrapper = shallowMount(InputDateWidget);

    expect(wrapper.find("input[type='date']").exists()).toBeTruthy();
  });

  it('should not have a label if prop "name" is undefined', () => {
    const wrapper = shallowMount(InputDateWidget);
    expect(wrapper.find('label').exists()).toBeFalsy();
  });

  it('should have a label if prop "name" is defined', () => {
    const wrapper = shallowMount(InputDateWidget, { propsData: { name: 'Stark' } });
    const labelWrapper = wrapper.find('label');
    expect(labelWrapper.text()).toEqual('Stark');
  });

  it('should not have a hyperlink element if prop "docUrl" is undefined', () => {
    const wrapper = shallowMount(InputDateWidget);
    expect(wrapper.find('a').exists()).toBeFalsy();
  });

  it('should have a hyperlink element if prop "docUrl" is defined', () => {
    const wrapper = shallowMount(InputDateWidget, { propsData: { docUrl: 'testURL' } });
    const linkWrapper = wrapper.find('a');
    expect(wrapper.find('a').exists()).toBeTruthy();
    expect(linkWrapper.attributes().href).toEqual('testURL');
  });

  it('should have an empty placeholder', () => {
    const wrapper = shallowMount(InputDateWidget, {
      propsData: {
        value: new Date('2021-01-01'),
      },
    });
    const el = wrapper.find("input[type='date']").element as HTMLInputElement;

    expect(el.placeholder).toEqual('');
  });

  it('should have a placeholder', () => {
    const wrapper = shallowMount(InputDateWidget, {
      propsData: {
        placeholder: 'I m a placeholder',
        value: new Date('2021-01-01'),
      },
    });
    const el = wrapper.find("input[type='date']").element as HTMLInputElement;

    expect(el.placeholder).toEqual('I m a placeholder');
  });

  it('should have an empty input', () => {
    const wrapper = shallowMount(InputDateWidget);
    const el = wrapper.find("input[type='date']").element as HTMLInputElement;

    expect(el.value).toEqual('');
  });

  it('should have a non empty input', () => {
    const wrapper = shallowMount(InputDateWidget, {
      propsData: { value: new Date('2021-01-01') },
    });
    const el = wrapper.find("input[type='date']").element as HTMLInputElement;

    expect(el.value).toEqual('2021-01-01');
  });

  it('should emit "input" event on update', () => {
    const wrapper = shallowMount(InputDateWidget, {
      propsData: {
        value: '',
      },
    });
    const inputWrapper = wrapper.find('input[type="date"]');
    (inputWrapper.element as HTMLInputElement).value = '2021-01-01';
    inputWrapper.trigger('input', { value: '2021-01-01' });
    expect(wrapper.emitted()).toEqual({ input: [['2021-01-01']] });
  });

  it('should display an error message if messageError exists', () => {
    const wrapper = mount(InputDateWidget, {
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
    const wrapper = mount(InputDateWidget);
    expect(wrapper.find('.field__msg-error').exists()).toBeFalsy();
  });

  it('should display an warning message if messageError exists', () => {
    const wrapper = mount(InputDateWidget, {
      propsData: {
        warning: 'warning',
      },
    });
    expect(wrapper.find('.field__msg-warning').exists()).toBeTruthy();
  });

  it('should not display a warning message if messageError does not exist', () => {
    const wrapper = mount(InputDateWidget);
    expect(wrapper.find('.field__msg-warning').exists()).toBeFalsy();
  });
});
