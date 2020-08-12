import { createLocalVue, shallowMount } from '@vue/test-utils';
import Vuex from 'vuex';

import MultiInputTextWidget from '@/components/stepforms/widgets/MultiInputText.vue';

const localVue = createLocalVue();
localVue.use(Vuex);

describe('Widget MultiInputText', () => {
  it('should instantiate', () => {
    const wrapper = shallowMount(MultiInputTextWidget);
    expect(wrapper.exists()).toBeTruthy();
  });

  it('should have an empty placeholder', () => {
    const wrapper = shallowMount(MultiInputTextWidget, {
      propsData: {
        value: ['foo'],
      },
    });
    const multiselect = wrapper.find('multiselect-stub');
    expect(multiselect.attributes().placeholder).toEqual('');
  });

  it('should have a placeholder', () => {
    const wrapper = shallowMount(MultiInputTextWidget, {
      propsData: {
        placeholder: 'I m a placeholder',
        value: ['foo'],
      },
    });
    const multiselect = wrapper.find('multiselect-stub');
    expect(multiselect.attributes().placeholder).toEqual('I m a placeholder');
  });

  it('should have an empty input', () => {
    const wrapper = shallowMount(MultiInputTextWidget);
    const multiselect = wrapper.find('multiselect-stub');
    expect(multiselect.attributes().value).toEqual('');
  });

  it('should have a non empty input', () => {
    const wrapper = shallowMount(MultiInputTextWidget, {
      propsData: { value: ['foo'] },
    });
    const multiselect = wrapper.find('multiselect-stub');
    expect(multiselect.attributes().value).toEqual('foo');
  });

  it('should update "options" on search-change event', () => {
    const wrapper = shallowMount(MultiInputTextWidget);
    const multiselect = wrapper.find('multiselect-stub');
    multiselect.vm.$emit('search-change', 'Foo');
    expect(wrapper.vm.$data.options).toEqual(['Foo']);
  });

  it('should emit "input" event when multiselect emit "input"', async () => {
    const wrapper = shallowMount(MultiInputTextWidget);
    wrapper.find('multiselect-stub').vm.$emit('input', ['a', 'b']);
    expect(wrapper.emitted().input[0][0]).toEqual(['a', 'b']);
  });

  it('should clear "options" on input', () => {
    const wrapper = shallowMount(MultiInputTextWidget, { data: () => ({ options: ['Foo'] }) });
    expect(wrapper.vm.$data.options).toEqual(['Foo']);
    wrapper.find('multiselect-stub').vm.$emit('input');
    expect(wrapper.vm.$data.options).toEqual([]);
  });

  describe('with multiVariable', () => {
    let wrapper: any;
    beforeEach(() => {
      wrapper = shallowMount(MultiInputTextWidget, {
        data: () => ({ options: ['Foo'] }),
        propsData: { multiVariable: true },
      });
    });
    it('should use MultiVariableInput', () => {
      expect(wrapper.find('MultiVariableInput-stub').exists()).toBe(true);
      expect(wrapper.find('VariableInput-stub').exists()).toBe(false);
    });
  });
});
