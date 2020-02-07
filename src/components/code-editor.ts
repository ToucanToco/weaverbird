/*
  This module handles the CodeEditor used in the CodeEditorWidget
  The default CodeEditor is a native textarea.

  You can set another Code Editor passing to `setCodeEditor`
  a vue component with the following requirements:
  - It must accept a `value` property and emit an `input` event
    as it will be used with a `v-model`
  - Optionally:
    - emit `blur` and `focus` event
    - a placeholder `property`

  An example of code editor customization can be found in the playground.
*/
import Vue, { VueConstructor } from 'vue';

import DefaultCodeEditor from '@/components/stepforms/widgets/DefaultCodeEditor.vue';

let CodeEditor = DefaultCodeEditor;

export function setCodeEditor(CustomCodeEditor: VueConstructor<Vue>) {
  CodeEditor = CustomCodeEditor;
}

export { CodeEditor };
