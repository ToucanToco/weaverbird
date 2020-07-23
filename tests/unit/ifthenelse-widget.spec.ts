import { shallowMount } from '@vue/test-utils';

import IfThenElseWidget from '@/components/stepforms/widgets/IfThenElseWidget.vue';

describe('IfThenElseWidget', () => {
  it('should instantiate', () => {
    const wrapper = shallowMount(IfThenElseWidget);
    expect(wrapper.exists()).toBeTruthy();
  });

  it('should have exactly 3 input components by default', () => {
    const wrapper = shallowMount(IfThenElseWidget);
    const filtereditorWrappers = wrapper.findAll('filtereditor-stub');
    expect(filtereditorWrappers.length).toEqual(1);
    const inputtextWrappers = wrapper.findAll('inputtextwidget-stub');
    expect(inputtextWrappers.length).toEqual(2);
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

  it('should add nested formula when clicking on add button', () => {
    const wrapper = shallowMount(IfThenElseWidget);
    const button = wrapper.findAll('.ifthenelse-widget__add');
    expect(button.length).toEqual(1);
    button.trigger('click');
    expect(wrapper.emitted().input).toBeDefined();
    expect(wrapper.emitted().input[0]).toEqual([
      {
        if: { column: '', value: '', operator: 'eq' },
        then: '',
        else: { if: { column: '', value: '', operator: 'eq' }, then: '', else: '' },
      },
    ]);
  });

  it('should not have delete button if root', () => {
    const wrapper = shallowMount(IfThenElseWidget, { propsData: { isRoot: true } });
    expect(wrapper.findAll('.ifthenelse-widget__remove').length).toEqual(0);
  });

  it('should emit delete nested formula when clicking on delete button', () => {
    const wrapper = shallowMount(IfThenElseWidget, { propsData: { isRoot: false } });
    const button = wrapper.findAll('.ifthenelse-widget__remove');
    expect(button.length).toEqual(1);
    button.trigger('click');
    expect(wrapper.emitted().delete).toBeDefined();
  });

  it('should not emit input when deleting an else', () => {
    const wrapper = shallowMount(IfThenElseWidget, {
      propsData: {
        value: {
          if: { column: '', value: '', operator: 'eq' },
          then: '',
          else: '',
        },
      },
    });
    wrapper.vm.$emit('deleted');
    expect(wrapper.emitted().input).not.toBeDefined();
  });

  it('should delete nested formula when a nested emitted delete', () => {
    const wrapper = shallowMount(IfThenElseWidget, {
      propsData: {
        value: {
          if: { column: '', value: '', operator: 'eq' },
          then: '',
          else: { if: { column: '', value: '', operator: 'eq' }, then: '', else: '' },
        },
      },
    });
    wrapper.find('ifthenelse-widget-stub').vm.$emit('delete');
    expect(wrapper.emitted().input).toBeDefined();
    expect(wrapper.emitted().input[0]).toEqual([
      {
        if: { column: '', value: '', operator: 'eq' },
        then: '',
        else: '',
      },
    ]);
  });

  it('should keep children of nested deleted formula', () => {
    const wrapper = shallowMount(IfThenElseWidget, {
      propsData: {
        value: {
          if: { column: '', value: '', operator: 'eq' },
          then: '',
          else: {
            if: { column: '', value: '', operator: 'eq' },
            then: '',
            else: { if: { column: '', value: '', operator: 'eq' }, then: '', else: '' },
          },
        },
      },
    });
    wrapper.find('ifthenelse-widget-stub').vm.$emit('delete');
    expect(wrapper.emitted().input).toBeDefined();
    expect(wrapper.emitted().input[0]).toEqual([
      {
        if: { column: '', value: '', operator: 'eq' },
        then: '',
        else: { if: { column: '', value: '', operator: 'eq' }, then: '', else: '' },
      },
    ]);
  });

  it('should keep else value when deleted', () => {
    const wrapper = shallowMount(IfThenElseWidget, {
      propsData: {
        value: {
          if: { column: '', value: '', operator: 'eq' },
          then: '',
          else: {
            if: { column: '', value: '', operator: 'eq' },
            then: '',
            else: 'else',
          },
        },
      },
    });
    wrapper.find('ifthenelse-widget-stub').vm.$emit('delete');
    expect(wrapper.emitted().input).toBeDefined();
    expect(wrapper.emitted().input[0]).toEqual([
      {
        if: { column: '', value: '', operator: 'eq' },
        then: '',
        else: 'else',
      },
    ]);
  });

  it('should emit the right value when a nested "else" is updated', () => {
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

  it('should be expanded by default', () => {
    const wrapper = shallowMount(IfThenElseWidget);
    expect(wrapper.find('.ifthenelse-widget__container').classes()).not.toContain(
      'ifthenelse-widget__container--collapsed',
    );
  });

  it('should collapsed when clicking on arrow', () => {
    const wrapper = shallowMount(IfThenElseWidget);
    const button = wrapper.findAll('.ifthenelse-widget__collapse-button');
    expect(button.length).toEqual(1);
    button.trigger('click');
    expect(wrapper.find('.ifthenelse-widget__container').classes()).toContain(
      'ifthenelse-widget__container--collapsed',
    );
  });

  it('should hide delete button and show description/expand button when collapsed', () => {
    const wrapper = shallowMount(IfThenElseWidget, {
      propsData: {
        value: {
          if: { column: '', value: '', operator: 'eq' },
          then: '',
          else: { if: { column: '', value: '', operator: 'eq' }, then: '', else: '' },
        },
      },
    });
    const button = wrapper.findAll('.ifthenelse-widget__collapse-button');
    button.trigger('click');
    const expandTextButton = wrapper.findAll('.ifthenelse-widget__collapse-text');
    expect(expandTextButton.length).toEqual(1);
    const description = wrapper.findAll('.ifthenelse-widget__collapse-description');
    expect(description.length).toEqual(1);
    const deleteButton = wrapper.findAll('.ifthenelse-widget__remove');
    expect(deleteButton.length).toEqual(0);
  });

  it('should show delete button and hide description/expand button when expanded', () => {
    const wrapper = shallowMount(IfThenElseWidget, {
      propsData: {
        value: {
          if: { column: '', value: '', operator: 'eq' },
          then: '',
          else: { if: { column: '', value: '', operator: 'eq' }, then: '', else: '' },
        },
      },
    });
    const expandTextButton = wrapper.findAll('.ifthenelse-widget__collapse-text');
    expect(expandTextButton.length).toEqual(0);
    const description = wrapper.findAll('.ifthenelse-widget__collapse-description');
    expect(description.length).toEqual(0);
    const deleteButton = wrapper.findAll('.ifthenelse-widget__remove');
    expect(deleteButton.length).toEqual(1);
  });

  it('should compute description when collapsed', () => {
    const wrapper = shallowMount(IfThenElseWidget, {
      propsData: {
        value: {
          if: { column: 'column', value: 1, operator: 'eq' },
          then: 'foo',
          else: 'bar',
        },
      },
    });
    const button = wrapper.findAll('.ifthenelse-widget__collapse-button');
    button.trigger('click');
    expect(wrapper.find('.ifthenelse-widget__collapse-description').text()).toBe(
      `column is 1 THEN 'foo' ELSE 'bar'`,
    );
  });

  it('should expand formula when a nested emitted delete', () => {
    const wrapper = shallowMount(IfThenElseWidget, {
      propsData: {
        value: {
          if: { column: '', value: '', operator: 'eq' },
          then: '',
          else: { if: { column: '', value: '', operator: 'eq' }, then: '', else: '' },
        },
      },
    });
    const button = wrapper.findAll('.ifthenelse-widget__collapse-button');
    button.trigger('click');
    wrapper.find('ifthenelse-widget-stub').vm.$emit('delete');
    expect(wrapper.find('.ifthenelse-widget__container').classes()).not.toContain(
      'ifthenelse-widget__container--collapsed',
    );
  });
});
