import { mount, shallowMount } from '@vue/test-utils';
import Vue from 'vue';

import { CodeEditor, CodeEditorConfigs, setAvailableCodeEditors } from '@/components/code-editor';
import CodeEditorWidget from '@/components/stepforms/widgets/CodeEditorWidget.vue';

describe('Widget CodeEditorWidget', () => {
  it('should instantiate', () => {
    const wrapper = shallowMount(CodeEditorWidget);

    expect(wrapper.exists()).toBeTruthy();
  });

  it('should have a component', () => {
    const wrapper = shallowMount(CodeEditorWidget);

    expect(wrapper.find('.widget-code-editor').exists()).toBeTruthy();
  });

  it('should not have a label if prop "name" is undefined', () => {
    const wrapper = shallowMount(CodeEditorWidget);
    expect(wrapper.find('label').exists()).toBeFalsy();
  });

  it('should have a label if prop "name" is defined', () => {
    const wrapper = shallowMount(CodeEditorWidget, { propsData: { name: 'Stark' } });
    const labelWrapper = wrapper.find('label');
    expect(labelWrapper.text()).toEqual('Stark');
  });

  it('should have an empty placeholder', () => {
    const wrapper = shallowMount(CodeEditorWidget, {
      propsData: {
        value: 'foo',
      },
    });

    const codeEditor = wrapper.find('.widget-code-editor');
    expect(codeEditor.attributes().placeholder).toEqual('');
  });

  it('should have a placeholder', () => {
    const wrapper = shallowMount(CodeEditorWidget, {
      propsData: {
        placeholder: 'I m a placeholder',
        value: 'foo',
      },
    });
    const codeEditor = wrapper.find('.widget-code-editor');
    expect(codeEditor.attributes().placeholder).toEqual('I m a placeholder');
  });

  it('should have an empty value', () => {
    const wrapper = shallowMount(CodeEditorWidget);
    const codeEditor = wrapper.find('.widget-code-editor');

    expect(codeEditor.attributes().value).toEqual('');
  });

  it('should have a non empty value', () => {
    const wrapper = shallowMount(CodeEditorWidget, {
      propsData: { value: 'foo' },
    });
    const codeEditor = wrapper.find('.widget-code-editor');

    expect(codeEditor.attributes().value).toEqual('foo');
  });

  it('should add the right class on focus', async () => {
    const wrapper = mount(CodeEditorWidget, {
      propsData: { value: 'foo' },
    });
    const codeEditor = wrapper.find('.widget-code-editor');
    codeEditor.vm.$emit('focus');
    expect(codeEditor.classes()).toContain('widget-code-editor--focused');
  });

  it('should emit "input" event on update', () => {
    const wrapper = shallowMount(CodeEditorWidget, {
      propsData: {
        value: 'Star',
      },
    });
    const codeEditor = wrapper.find('.widget-code-editor');
    codeEditor.vm.$emit('input', 'new value');
    expect(wrapper.emitted()).toEqual({ input: [['new value']] });
  });

  it('should set / unset "isFocused" on focus / blur events', () => {
    const wrapper = mount(CodeEditorWidget);
    const codeEditor = wrapper.find('.widget-code-editor');
    codeEditor.vm.$emit('focus');
    expect(wrapper.vm.$data.isFocused).toBeTruthy();
    codeEditor.vm.$emit('blur');
    expect(wrapper.vm.$data.isFocused).toBeFalsy();
  });

  it('should display an error message if messageError exists', () => {
    const wrapper = shallowMount(CodeEditorWidget, {
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
    const wrapper = shallowMount(CodeEditorWidget);
    expect(wrapper.find('.field__msg-error').exists()).toBeFalsy();
  });

  it('should display an warning message if messageError exists', () => {
    const wrapper = shallowMount(CodeEditorWidget, {
      propsData: {
        warning: 'warning',
      },
    });
    expect(wrapper.find('.field__msg-warning').exists()).toBeTruthy();
  });

  it('should not display a warning message if messageError does not exist', () => {
    const wrapper = shallowMount(CodeEditorWidget);
    expect(wrapper.find('.field__msg-warning').exists()).toBeFalsy();
  });

  describe('custom lang', () => {
    it('should use custom code editor config if lang param is provided', () => {
      setAvailableCodeEditors({ configs: { json: Vue.extend(), javascript: Vue.extend() } });
      const wrapper = shallowMount(CodeEditorWidget, {
        propsData: { config: 'javascript' },
      });
      const codeEditorData = wrapper.vm.$data.codeEditor;
      expect(codeEditorData).toEqual(CodeEditorConfigs.javascript);
    });

    it('... but keep default editor config if lang is unavailable', () => {
      setAvailableCodeEditors({ configs: { json: Vue.extend() } });
      const wrapper = shallowMount(CodeEditorWidget, {
        propsData: { config: 'javascript' },
      });
      const codeEditorData = wrapper.vm.$data.codeEditor;
      expect(codeEditorData).toEqual(CodeEditor);
    });
  });
});
