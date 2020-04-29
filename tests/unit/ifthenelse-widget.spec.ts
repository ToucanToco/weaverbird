import { shallowMount } from '@vue/test-utils';

import IfThenElseWidget from '@/components/stepforms/widgets/IfThenElseWidget.vue';

describe('IfThenElseWidget', () => {
  it('should instantiate', () => {
    const wrapper = shallowMount(IfThenElseWidget);
    expect(wrapper.exists()).toBeTruthy();
  });

  it('should have exactly 4 input components by default', () => {
    const wrapper = shallowMount(IfThenElseWidget);
    const filtereditorWrappers = wrapper.findAll('filtereditor-stub');
    expect(filtereditorWrappers.length).toEqual(1);
    const inputtextWrappers = wrapper.findAll('inputtextwidget-stub');
    expect(inputtextWrappers.length).toEqual(2);
    const autocompleteWrappers = wrapper.findAll('autocompletewidget-stub');
    expect(autocompleteWrappers.length).toEqual(1);
  });

  it('should be able to nest itself', () => {
    const wrapper = shallowMount(IfThenElseWidget, {
      propsData: {
        value: {
          if: { column: '', value: '', operator: 'eq' },
          then: '',
          else: { if: { column: '', value: '', operator: 'eq' }, then: '', else: '' },
        },
      },
    });
    const filtereditorWrappers = wrapper.findAll('filtereditor-stub');
    expect(filtereditorWrappers.length).toEqual(1);
    const inputtextWrappers = wrapper.findAll('inputtextwidget-stub');
    expect(inputtextWrappers.length).toEqual(1);
    const autocompleteWrappers = wrapper.findAll('autocompletewidget-stub');
    expect(autocompleteWrappers.length).toEqual(1);
    const testWrappers = wrapper.findAll('ifthenelse-widget-stub');
    expect(testWrappers.length).toEqual(1);
  });

  it('should emit input when the "if" condition is updated', () => {
    const wrapper = shallowMount(IfThenElseWidget);
    wrapper
      .find('filtereditor-stub')
      .vm.$emit('filterTreeUpdated', { column: 'foo', value: 'bar', operator: 'gt' });
    expect(wrapper.emitted().input).toBeDefined();
    expect(wrapper.emitted().input[0]).toEqual([
      {
        if: { column: 'foo', value: 'bar', operator: 'gt' },
        then: '',
        else: '',
      },
    ]);
  });

  it('should emit input when the "then" condition is updated', () => {
    const wrapper = shallowMount(IfThenElseWidget);
    wrapper
      .findAll('inputtextwidget-stub')
      .at(0)
      .vm.$emit('input', 'toto');
    expect(wrapper.emitted().input).toBeDefined();
    expect(wrapper.emitted().input[0]).toEqual([
      {
        if: { column: '', value: '', operator: 'eq' },
        then: 'toto',
        else: '',
      },
    ]);
  });

  it('should emit input when the "else" condition is updated', () => {
    const wrapper = shallowMount(IfThenElseWidget);
    wrapper
      .findAll('inputtextwidget-stub')
      .at(1)
      .vm.$emit('input', '2 * Foo + Bar');
    expect(wrapper.emitted().input).toBeDefined();
    expect(wrapper.emitted().input[0]).toEqual([
      {
        if: { column: '', value: '', operator: 'eq' },
        then: '',
        else: '2 * Foo + Bar',
      },
    ]);
  });

  it('should reset the "else" value properly depending on the "else" mode', () => {
    const wrapper = shallowMount(IfThenElseWidget);
    wrapper.find('autocompletewidget-stub').vm.$emit('input', 'ELSE:');
    expect(wrapper.emitted().input).toBeDefined();
    expect(wrapper.emitted().input[0]).toEqual([
      {
        if: { column: '', value: '', operator: 'eq' },
        then: '',
        else: '',
      },
    ]);

    wrapper.find('autocompletewidget-stub').vm.$emit('input', 'ELSE IF:');
    expect(wrapper.emitted().input).toBeDefined();
    expect(wrapper.emitted().input[1]).toEqual([
      {
        if: { column: '', value: '', operator: 'eq' },
        then: '',
        else: {
          if: { column: '', value: '', operator: 'eq' },
          then: '',
          else: '',
        },
      },
    ]);
  });

  it('should emit the right value when a nsted "else" is updated', () => {
    const wrapper = shallowMount(IfThenElseWidget, {
      propsData: {
        value: {
          if: { column: '', value: '', operator: 'eq' },
          then: '',
          else: { if: { column: '', value: '', operator: 'eq' }, then: '', else: '' },
        },
      },
    });
    wrapper.find('ifthenelse-widget-stub').vm.$emit('input', {
      if: { column: 'foo', value: 'bar', operator: 'eq' },
      then: 'toto',
      else: 'tata',
    });
    expect(wrapper.emitted().input).toBeDefined();
    expect(wrapper.emitted().input[0]).toEqual([
      {
        if: { column: '', value: '', operator: 'eq' },
        then: '',
        else: {
          if: { column: 'foo', value: 'bar', operator: 'eq' },
          then: 'toto',
          else: 'tata',
        },
      },
    ]);
  });
});
