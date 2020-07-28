import { shallowMount } from '@vue/test-utils';

import IfThenElseWidget from '@/components/stepforms/widgets/IfThenElseWidget.vue';

describe('IfThenElseWidget', () => {
  describe('default', () => {
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
  });

  it('should have a footer only on else mode', () => {
    const wrapper = shallowMount(IfThenElseWidget);
    expect(wrapper.findAll('.ifthenelse-widget__footer').length).toEqual(1);
    expect(wrapper.findAll('.ifthenelse-widget__row__link--hidden').length).toEqual(0);
    wrapper.setProps({
      value: {
        if: { column: '', value: '', operator: 'eq' },
        then: '',
        else: { if: { column: '', value: '', operator: 'eq' }, then: '', else: '' },
      },
    });
    expect(wrapper.findAll('.ifthenelse-widget__footer').length).toEqual(0);
    expect(wrapper.findAll('.ifthenelse-widget__row__link--hidden').length).toEqual(1);
  });

  describe('edition', () => {
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
  });

  describe('add elseif', () => {
    it('should have a add button', () => {
      const wrapper = shallowMount(IfThenElseWidget);
      const button = wrapper.findAll('.ifthenelse-widget__add');
      expect(button.length).toEqual(1);
    });
    it('should add elseif when clicking on add button', () => {
      const wrapper = shallowMount(IfThenElseWidget);
      wrapper.find('.ifthenelse-widget__add').trigger('click');
      expect(wrapper.emitted().input).toBeDefined();
      expect(wrapper.emitted().input[0]).toEqual([
        {
          if: { column: '', value: '', operator: 'eq' },
          then: '',
          else: { if: { column: '', value: '', operator: 'eq' }, then: '', else: '' },
        },
      ]);
    });
    it('should transfer else value to new elseif', () => {
      const wrapper = shallowMount(IfThenElseWidget, {
        propsData: {
          value: {
            if: { column: '', value: '', operator: 'eq' },
            then: '',
            else: 'else',
          },
        },
      });
      wrapper.find('.ifthenelse-widget__add').trigger('click');
      expect(wrapper.emitted().input).toBeDefined();
      expect(wrapper.emitted().input[0]).toEqual([
        {
          if: { column: '', value: '', operator: 'eq' },
          then: '',
          else: { if: { column: '', value: '', operator: 'eq' }, then: '', else: 'else' },
        },
      ]);
    });
  });

  describe('collapse', () => {
    it('should have collapse arrow', () => {
      const wrapper = shallowMount(IfThenElseWidget);
      const button = wrapper.findAll('.ifthenelse-widget__collapse-button');
      expect(button.length).toEqual(1);
    });
    it('should be expanded by default', () => {
      const wrapper = shallowMount(IfThenElseWidget);
      expect(wrapper.find('.ifthenelse-widget__container').classes()).not.toContain(
        'ifthenelse-widget__container--collapsed',
      );
    });
    it('should show delete button when expanded', () => {
      const wrapper = shallowMount(IfThenElseWidget);
      const deleteButton = wrapper.findAll('.ifthenelse-widget__remove');
      expect(deleteButton.length).toEqual(1);
    });
    it('should hide expand button when expanded', () => {
      const wrapper = shallowMount(IfThenElseWidget);
      const expandTextButton = wrapper.findAll('.ifthenelse-widget__collapse-text');
      expect(expandTextButton.length).toEqual(0);
    });
    it('should hide description when expanded', () => {
      const wrapper = shallowMount(IfThenElseWidget);
      const expandTextButton = wrapper.findAll('.ifthenelse-widget__collapse-description');
      expect(expandTextButton.length).toEqual(0);
    });
    it('should toggle when clicking on arrow', () => {
      const wrapper = shallowMount(IfThenElseWidget);
      wrapper.find('.ifthenelse-widget__collapse-button').trigger('click');
      expect(wrapper.find('.ifthenelse-widget__container').classes()).toContain(
        'ifthenelse-widget__container--collapsed',
      );
      wrapper.find('.ifthenelse-widget__collapse-button').trigger('click');
      expect(wrapper.find('.ifthenelse-widget__container').classes()).not.toContain(
        'ifthenelse-widget__container--collapsed',
      );
    });
    it('should hide delete button when collapsed', () => {
      const wrapper = shallowMount(IfThenElseWidget);
      const button = wrapper.findAll('.ifthenelse-widget__collapse-button');
      button.trigger('click');
      const deleteButton = wrapper.findAll('.ifthenelse-widget__remove');
      expect(deleteButton.length).toEqual(0);
    });
    it('should show description when collapsed', () => {
      const wrapper = shallowMount(IfThenElseWidget);
      const button = wrapper.findAll('.ifthenelse-widget__collapse-button');
      button.trigger('click');
      const deleteButton = wrapper.findAll('.ifthenelse-widget__collapse-description');
      expect(deleteButton.length).toEqual(1);
    });
    it('should compute the right description', () => {
      const wrapper = shallowMount(IfThenElseWidget);
      const button = wrapper.findAll('.ifthenelse-widget__collapse-button');
      button.trigger('click');
      expect(wrapper.find('.ifthenelse-widget__collapse-description').text()).toBe(
        `... THEN ... ELSE ...`,
      );
    });
    it('should show expand button when collapsed', () => {
      const wrapper = shallowMount(IfThenElseWidget);
      const button = wrapper.findAll('.ifthenelse-widget__collapse-button');
      button.trigger('click');
      const expandTextButton = wrapper.findAll('.ifthenelse-widget__collapse-text');
      expect(expandTextButton.length).toEqual(1);
    });
    it('should expand when clicking on expand button', () => {
      const wrapper = shallowMount(IfThenElseWidget);
      wrapper.find('.ifthenelse-widget__collapse-button').trigger('click');
      expect(wrapper.find('.ifthenelse-widget__container').classes()).toContain(
        'ifthenelse-widget__container--collapsed',
      );
      wrapper.find('.ifthenelse-widget__collapse-text').trigger('click');
      expect(wrapper.find('.ifthenelse-widget__container').classes()).not.toContain(
        'ifthenelse-widget__container--collapsed',
      );
    });
  });

  describe('delete elseif', () => {
    it('should have a delete button', () => {
      const wrapper = shallowMount(IfThenElseWidget, {
        propsData: {
          value: {
            if: { column: '', value: '', operator: 'eq' },
            then: '',
            else: { if: { column: '', value: '', operator: 'eq' }, then: '', else: 'tata' },
          },
        },
      });
      const button = wrapper.findAll('.ifthenelse-widget__remove');
      expect(button.length).toEqual(1);
    });
    it('should not be able to delete root', () => {
      const wrapper = shallowMount(IfThenElseWidget, { propsData: { isRoot: true } });
      expect(wrapper.findAll('.ifthenelse-widget__remove').length).toEqual(0);
      wrapper.vm.$emit('deletedElseIf');
      expect(wrapper.emitted().input).not.toBeDefined();
    });
    it('should ask parent to be deleted when clicking on delete button', () => {
      const wrapper = shallowMount(IfThenElseWidget);
      wrapper.find('.ifthenelse-widget__remove').trigger('click');
      expect(wrapper.emitted().deletedElseIf).toBeDefined();
    });
    it('should transfer else value into else parent if has no children...', () => {
      const wrapper = shallowMount(IfThenElseWidget, {
        propsData: {
          value: {
            if: { column: '', value: '', operator: 'eq' },
            then: '',
            else: { if: { column: '', value: '', operator: 'eq' }, then: '', else: 'tata' },
          },
        },
      });
      wrapper.find('ifthenelse-widget-stub').vm.$emit('deletedElseIf');
      expect(wrapper.emitted().input).toBeDefined();
      expect(wrapper.emitted().input[0]).toEqual([
        {
          if: { column: '', value: '', operator: 'eq' },
          then: '',
          else: 'tata',
        },
      ]);
    });
    it('...else transfer children into elseif parent', () => {
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
      wrapper.find('ifthenelse-widget-stub').vm.$emit('deletedElseIf');
      expect(wrapper.emitted().input).toBeDefined();
      expect(wrapper.emitted().input[0]).toEqual([
        {
          if: { column: '', value: '', operator: 'eq' },
          then: '',
          else: { if: { column: '', value: '', operator: 'eq' }, then: '', else: '' },
        },
      ]);
    });

    it('should expand parent when an elseif is deleted', () => {
      const wrapper = shallowMount(IfThenElseWidget, {
        propsData: {
          value: {
            if: { column: '', value: '', operator: 'eq' },
            then: '',
            else: { if: { column: '', value: '', operator: 'eq' }, then: '', else: '' },
          },
        },
      });
      wrapper.find('.ifthenelse-widget__collapse-button').trigger('click');
      expect(wrapper.find('.ifthenelse-widget__container').classes()).toContain(
        'ifthenelse-widget__container--collapsed',
      );
      wrapper.find('ifthenelse-widget-stub').vm.$emit('deletedElseIf');
      expect(wrapper.find('.ifthenelse-widget__container').classes()).not.toContain(
        'ifthenelse-widget__container--collapsed',
      );
    });
  });
});
