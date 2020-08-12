import { createLocalVue, mount, shallowMount } from '@vue/test-utils';
import Vuex from 'vuex';

import MultiInputTextWidget from '@/components/stepforms/widgets/MultiInputText.vue';
import MultiVariableInput from '@/components/stepforms/widgets/MultiVariableInput.vue';
import VariableTag from '@/components/stepforms/widgets/VariableInputs/VariableTag.vue';

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
      wrapper = mount(MultiInputTextWidget, {
        data: () => ({ options: ['Foo'] }),
        propsData: {
          multiVariable: true,
          value: ['a', 'b', '{{ var1 }}'],
          variableDelimiters: { start: '{{', end: '}}' },
        },
      });
    });
    it('should use MultiVariableInput', () => {
      expect(wrapper.findAll(MultiVariableInput).length).toBe(1);
    });
    it('should use custom template', () => {
      expect(wrapper.findAll('.widget-multiinputtext__tag').length).toBe(3);
    });
    it('should use VariableTag with variables in multiselect', () => {
      expect(wrapper.findAll(VariableTag).length).toBe(1);
    });
  });
});
