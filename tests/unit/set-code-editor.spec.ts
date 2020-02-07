import { shallowMount } from '@vue/test-utils';
import Vue, { VNode } from 'vue';

import { setCodeEditor } from '@/components/code-editor';
import CodeEditorWidget from '@/components/stepforms/widgets/CodeEditorWidget.vue';

describe('setCodeEditor', () => {
  it('should set the code editor', () => {
    const CustomCodeEditor = Vue.extend({
      props: ['value', 'placeholder'],
      render(createElement): VNode {
        return createElement('textarea', {
          domProps: {
            value: this.value,
            placeholder: 'OMG I have to write code in here',
          },
          attrs: {
            type: 'text',
          },
          on: {
            input: (event: Event) => {
              const textarea = event.target as HTMLTextAreaElement;
              this.$emit('input', textarea.value);
            },
            blur: () => {
              this.$emit('blur');
            },
            focus: () => {
              this.$emit('focus');
            },
          },
        });
      },
    });
    setCodeEditor(CustomCodeEditor);
    const CodeEditorWidgetWrapper = shallowMount(CodeEditorWidget);

    expect(CodeEditorWidgetWrapper.vm.$data.CodeEditor).toEqual(CustomCodeEditor);
  });
});
