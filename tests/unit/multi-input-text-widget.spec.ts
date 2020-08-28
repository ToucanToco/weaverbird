import { createLocalVue, mount, shallowMount } from '@vue/test-utils';
import Vuex from 'vuex';

import MultiInputTextWidget from '@/components/stepforms/widgets/MultiInputText.vue';
import MultiVariableInput from '@/components/stepforms/widgets/MultiVariableInput.vue';
import VariableInput from '@/components/stepforms/widgets/VariableInput.vue';
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

  it('should not use an overflow on tags wrapper...', () => {
    const wrapper = mount(MultiInputTextWidget, {
      propsData: {
        value: ['a', 'b'],
        variableDelimiters: { start: '{{', end: '}}' },
      },
    });
    expect(wrapper.find('.widget-multiinputtext__multiselect--big').exists()).toBe(false);
  });

  it('...except with a lot of values', () => {
    const wrapper = mount(MultiInputTextWidget, {
      propsData: {
        value: ['a', 'b', '{{ var1 }}', '{{ var2 }}', '{{ var6 }}', '{{ var7 }}', '{{ var8 }}'],
        variableDelimiters: { start: '{{', end: '}}' },
      },
    });
    expect(wrapper.find('.widget-multiinputtext__multiselect--big').exists()).toBe(true);
  });

  it('should use MultiVariableInput', () => {
    const wrapper = mount(MultiInputTextWidget, {
      propsData: {
        value: ['a', 'b', '{{ var1 }}'],
        variableDelimiters: { start: '{{', end: '}}' },
      },
    });
    expect(wrapper.findAll(MultiVariableInput).length).toBe(1);
    expect(wrapper.findAll(VariableInput).length).toBe(0);
  });

  it('should not use custom template for tags', () => {
    const wrapper = mount(MultiInputTextWidget, {
      propsData: {
        value: ['a', 'b', '{{ var1 }}', '{{ var2 }}'],
        variableDelimiters: { start: '{{', end: '}}' },
      },
    });
    expect(wrapper.findAll('.widget-multiinputtext__tag').length).toBe(0);
  });

  it('... until there is availableVariables', () => {
    const wrapper = mount(MultiInputTextWidget, {
      propsData: {
        value: ['a', 'b', '{{ var1 }}', '{{ var2 }}'],
        variableDelimiters: { start: '{{', end: '}}' },
        availableVariables: [],
      },
    });
    expect(wrapper.findAll('.widget-multiinputtext__tag').length).toBe(4);
  });

  it('... or advanced variable is enabled', () => {
    const wrapper = mount(MultiInputTextWidget, {
      propsData: {
        value: ['a', 'b', '{{ var1 }}', '{{ var2 }}'],
        variableDelimiters: { start: '{{', end: '}}' },
        advancedVariableDelimiters: { start: '<<<', end: '>>>' },
      },
    });
    expect(wrapper.findAll('.widget-multiinputtext__tag').length).toBe(4);
  });

  it('should use specific variable template for variable tags', () => {
    const wrapper = mount(MultiInputTextWidget, {
      propsData: {
        value: ['a', 'b', '{{ var1 }}', '{{ var2 }}'],
        variableDelimiters: { start: '{{', end: '}}' },
        availableVariables: [],
      },
    });
    expect(wrapper.findAll(VariableTag).length).toBe(2);
  });

  it('... and advanced variable tags', () => {
    const wrapper = mount(MultiInputTextWidget, {
      propsData: {
        value: ['a', 'b', '{{ var1 }}', '{{ var2 }}', '<%= var3 %>'],
        variableDelimiters: { start: '{{', end: '}}' },
        availableVariables: [],
        advancedVariableDelimiters: { start: '<%=', end: '%>' },
      },
    });
    expect(wrapper.findAll(VariableTag).length).toBe(3);
  });

  it('should remove variable from value when clicking on tag', async () => {
    const wrapper = mount(MultiInputTextWidget, {
      propsData: {
        value: ['a', 'b'],
        variableDelimiters: { start: '{{', end: '}}' },
        availableVariables: [],
      },
    });
    const tag = wrapper.findAll('.widget-multiinputtext__tag').at(0);
    tag.find('.multiselect__tag-icon').trigger('mousedown');
    await wrapper.vm.$nextTick();
    expect(wrapper.emitted().input[0][0]).toStrictEqual(['b']);
  });

  it('should remove variable from value when clicking on variable tag', async () => {
    const wrapper = mount(MultiInputTextWidget, {
      propsData: {
        value: ['a', '{{ var1 }}'],
        variableDelimiters: { start: '{{', end: '}}' },
        availableVariables: [],
      },
    });
    const variableTag = wrapper.findAll(VariableTag).at(0);
    variableTag.vm.$emit('removed');
    await wrapper.vm.$nextTick();
    expect(wrapper.emitted().input[0][0]).toStrictEqual(['a']);
  });

  describe('without multiVariable', () => {
    let wrapper: any;
    beforeEach(() => {
      wrapper = mount(MultiInputTextWidget, {
        data: () => ({ options: ['Foo'] }),
        propsData: {
          multiVariable: false,
          value: ['a', 'b', '{{ var1 }}'],
          variableDelimiters: { start: '{{', end: '}}' },
        },
      });
    });
    it('should use VariableInput', () => {
      expect(wrapper.findAll(VariableInput).length).toBe(1);
      expect(wrapper.findAll(MultiVariableInput).length).toBe(0);
    });
    it('should not use custom template', () => {
      expect(wrapper.find('.widget-multiinputtext__tag').exists()).toBe(false);
    });
  });

  describe('when tags are advanced variable', () => {
    let wrapper: any;
    beforeEach(() => {
      wrapper = mount(MultiInputTextWidget, {
        propsData: {
          value: ['{{ var1 }}', '{{ var2 }}'],
          variableDelimiters: { start: '{{', end: '}}' },
          advancedVariableDelimiters: { start: '<<<', end: '>>>' },
          availableVariables: [],
        },
      });
    });

    it('should select the advanced variable to edit when clicking on tag', async () => {
      const variableTag = wrapper.findAll(VariableTag).at(0);
      variableTag.vm.$emit('edited');
      await wrapper.vm.$nextTick();
      expect(wrapper.find(MultiVariableInput).props().selectedAdvancedVariable).toBe('{{ var1 }}');
    });

    it('should reset the selected variable when multi variable input ask to', async () => {
      wrapper.setData({ selectedAdvancedVariable: '{{ var1 }}' });
      wrapper.find(MultiVariableInput).vm.$emit('resetSelectedAdvancedVariable');
      await wrapper.vm.$nextTick();
      expect(wrapper.find(MultiVariableInput).props().selectedAdvancedVariable).toBe('');
    });

    it('should reset the selected variable when updating value', async () => {
      wrapper.find(MultiVariableInput).vm.$emit('input', ['{{ var1 }}']);
      await wrapper.vm.$nextTick();
      expect(wrapper.find(MultiVariableInput).props().selectedAdvancedVariable).toBe('');
    });
  });
});
