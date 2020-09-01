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

export type CustomCodeEditor = VueConstructor<Vue>;
let CodeEditor: CustomCodeEditor = DefaultCodeEditor;

export function setCodeEditor(CustomCodeEditor: CustomCodeEditor) {
  CodeEditor = CustomCodeEditor;
}

/*
Use setAvailableCodeEditors to provide a list of custom codeEditor config
Each config must be associate to a lang key
Then in a codeEditorWidget use the lang param to get the associated config
It won't replace the default setCodeEditor
*/
type CustomCodeEditorList = { [lang: string]: CustomCodeEditor };
let AvailableCodeEditors: CustomCodeEditorList = {};

export function setAvailableCodeEditors(CustomCodeEditors: CustomCodeEditorList) {
  AvailableCodeEditors = CustomCodeEditors;
}

export { CodeEditor, AvailableCodeEditors };
