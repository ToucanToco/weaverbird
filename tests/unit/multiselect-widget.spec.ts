import { mount } from '@vue/test-utils';

import MultiSelectWidget from '@/components/stepforms/widgets/Multiselect.vue';
import MultiVariableInput from '@/components/stepforms/widgets/MultiVariableInput.vue';
import VariableTag from '@/components/stepforms/widgets/VariableInputs/VariableTag.vue';

describe('Widget Multiselect', () => {
  it('should not have specific templates if the prop withExample is false', () => {
    const wrapper = mount(MultiSelectWidget, {
      propsData: { withExample: false, options: [{ label: 'foo', example: 'bar' }] },
    });
    expect(wrapper.find('.option__title').exists()).toBeFalsy();
    expect(wrapper.find('.option__container').exists()).toBeFalsy();
  });

  it('should have specific templates if the prop withExample is true', () => {
    const wrapper = mount(MultiSelectWidget, {
      propsData: { withExample: true, options: [{ label: 'foo', example: 'bar' }] },
    });
    expect(wrapper.find('.option__title').exists()).toBeTruthy();
    expect(wrapper.find('.option__container').exists()).toBeTruthy();
  });

  it('should add a tooltip to the option', () => {
    const wrapper = mount(MultiSelectWidget, {
      propsData: {
        withExample: true,
        options: [{ label: 'foo', example: 'bar', tooltip: 'ukulélé' }],
      },
    });
    expect(wrapper.find('.option__container').exists()).toBeTruthy();
    expect(wrapper.find('.option__container').attributes('title')).toEqual('ukulélé');
  });

  it('should use MultiVariableInput', () => {
    const wrapper = mount(MultiSelectWidget, {
      propsData: {
        value: ['a', 'b', '{{ var1 }}'],
        variableDelimiters: { start: '{{', end: '}}' },
      },
    });
    expect(wrapper.findAll(MultiVariableInput).length).toBe(1);
  });

  it('should pass the values as string to the MultiVariableInput', () => {
    const wrapper = mount(MultiSelectWidget, {
      propsData: {
        value: ['a', 'b', '{{ var1 }}'],
        variableDelimiters: { start: '{{', end: '}}' },
      },
    });
    expect(
      wrapper
        .findAll(MultiVariableInput)
        .at(0)
        .props('value'),
    ).toStrictEqual(['a', 'b', '{{ var1 }}']);
  });

  it('should pass the values as string to the MultiVariableInput in object mode', () => {
    const wrapper = mount(MultiSelectWidget, {
      propsData: {
        value: [{ name: 'a' }, { name: 'b' }, { name: '{{ var1 }}' }],
        label: 'name',
        trackBy: 'name',
        variableDelimiters: { start: '{{', end: '}}' },
      },
    });
    expect(
      wrapper
        .findAll(MultiVariableInput)
        .at(0)
        .props('value'),
    ).toStrictEqual(['a', 'b', '{{ var1 }}']);
  });

  it('should use custom template for tags', () => {
    const wrapper = mount(MultiSelectWidget, {
      propsData: {
        value: ['a', 'b', '{{ var1 }}'],
        variableDelimiters: { start: '{{', end: '}}' },
      },
    });
    expect(wrapper.findAll('.widget-multiselect__tag').length).toBe(3);
  });

  it('should use specific variable template for variable tags', () => {
    const wrapper = mount(MultiSelectWidget, {
      propsData: {
        value: ['a', 'b', '{{ var1 }}'],
        variableDelimiters: { start: '{{', end: '}}' },
      },
    });
    expect(wrapper.findAll(VariableTag).length).toBe(1);
  });

  it('... and advanced variable tags', () => {
    const wrapper = mount(MultiSelectWidget, {
      propsData: {
        value: ['a', 'b', '{{ var1 }}', '<%= var3 %>'],
        variableDelimiters: { start: '{{', end: '}}' },
        advancedVariableDelimiters: { start: '<%=', end: '%>' },
      },
    });
    expect(wrapper.findAll(VariableTag).length).toBe(2);
  });

  it('should remove variable from value when clicking on tag', async () => {
    const wrapper = mount(MultiSelectWidget, {
      propsData: {
        value: ['a', 'b'],
        variableDelimiters: { start: '{{', end: '}}' },
        availableVariables: [],
      },
    });
    const tag = wrapper.findAll('.widget-multiselect__tag').at(0);
    tag.find('.multiselect__tag-icon').trigger('mousedown');
    await wrapper.vm.$nextTick();
    expect(wrapper.emitted().input[0][0]).toStrictEqual(['b']);
  });

  it('should remove variable from value when clicking on tag in object mode', async () => {
    const wrapper = mount(MultiSelectWidget, {
      propsData: {
        value: [{ name: 'a' }, { name: 'b' }],
        label: 'name',
        trackBy: 'name',
        variableDelimiters: { start: '{{', end: '}}' },
        availableVariables: [],
      },
    });
    const tag = wrapper.findAll('.widget-multiselect__tag').at(0);
    tag.find('.multiselect__tag-icon').trigger('mousedown');
    await wrapper.vm.$nextTick();
    expect(wrapper.emitted().input[0][0]).toStrictEqual([{ name: 'b' }]);
  });

  it('should remove variable from value when clicking on variable tag', async () => {
    const wrapper = mount(MultiSelectWidget, {
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

  it('should remove variable from value when clicking on variable tag in object mode', async () => {
    const wrapper = mount(MultiSelectWidget, {
      propsData: {
        value: [{ name: 'a' }, { name: '{{ var1 }}' }],
        label: 'name',
        trackBy: 'name',
        variableDelimiters: { start: '{{', end: '}}' },
        availableVariables: [],
      },
    });
    const variableTag = wrapper.findAll(VariableTag).at(0);
    variableTag.vm.$emit('removed');
    await wrapper.vm.$nextTick();
    expect(wrapper.emitted().input[0][0]).toStrictEqual([{ name: 'a' }]);
  });

  describe('when tags are advanced variable', () => {
    let wrapper: any;
    beforeEach(() => {
      wrapper = mount(MultiSelectWidget, {
        propsData: {
          value: ['{{ var1 }}', '{{ var2 }}'],
          advancedVariableDelimiters: { start: '<<<', end: '>>>' },
          variableDelimiters: { start: '{{', end: '}}' },
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
