import { shallowMount } from '@vue/test-utils';
import Vue, { VNode } from 'vue';

import { setAvailableCodeEditors } from '@/components/code-editor';
import CodeEditorWidget from '@/components/stepforms/widgets/CodeEditorWidget.vue';

// Create a code editor config for a specific lang
const codeEditorForLang = function(lang: string): any {
  return Vue.extend({
    props: ['value', 'placeholder'],
    render(createElement): VNode {
      return createElement('textarea', {
        domProps: {
          value: this.value,
          placeholder: `OMG I have to write code in ${lang} in here`,
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
};

describe('setAvailableCodeEditors', () => {
  it('should set the code editor based on defaultConfig ...', () => {
    const codeEditorConfig = {
      defaultConfig: 'json',
      configs: {
        json: codeEditorForLang('json'),
      },
    };
    setAvailableCodeEditors(codeEditorConfig);
    const CodeEditorWidgetWrapper = shallowMount(CodeEditorWidget);

    expect(CodeEditorWidgetWrapper.vm.$data.codeEditor).toEqual(codeEditorConfig.configs.json);
  });
  it('... or take the first config if not provided ...', () => {
    const codeEditorConfig = {
      configs: {
        javascript: codeEditorForLang('javascript'),
        json: codeEditorForLang('json'),
      },
    };
    setAvailableCodeEditors(codeEditorConfig);
    const CodeEditorWidgetWrapper = shallowMount(CodeEditorWidget);

    expect(CodeEditorWidgetWrapper.vm.$data.codeEditor).toEqual(
      codeEditorConfig.configs.javascript,
    );
  });
  it('... or unavailable', () => {
    const codeEditorConfig = {
      defaultConfig: 'javascript',
      configs: {
        json: codeEditorForLang('json'),
      },
    };
    setAvailableCodeEditors(codeEditorConfig);
    const CodeEditorWidgetWrapper = shallowMount(CodeEditorWidget);

    expect(CodeEditorWidgetWrapper.vm.$data.codeEditor).toEqual(codeEditorConfig.configs.json);
  });
});
