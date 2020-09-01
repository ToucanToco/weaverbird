/*
  This module handles the CodeEditor used in the CodeEditorWidget
  The default CodeEditor is a native textarea.

  You can set another CodeEditor passing to `setAvailableCodeEditors`
  a list of name associated to vue component with the following requirements:
  - It must accept a `value` property and emit an `input` event
    as it will be used with a `v-model`
  - Optionally:
    - emit `blur` and `focus` event
    - a placeholder `property`

  An example of code editor customization can be found in the playground.

  Optionally:
   - You can add a defaultConfig value to define the default config to use
*/
import Vue, { VueConstructor } from 'vue';

import DefaultCodeEditor from '@/components/stepforms/widgets/DefaultCodeEditor.vue';

export type CodeEditorConfig = VueConstructor<Vue>;
let CodeEditor: CodeEditorConfig = DefaultCodeEditor;

type CodeEditorConfigs = { [name: string]: CodeEditorConfig };
let CodeEditorConfigs: CodeEditorConfigs = {};

export function setAvailableCodeEditors({
  configs,
  defaultConfig,
}: {
  configs: CodeEditorConfigs;
  defaultConfig?: string;
}) {
  CodeEditorConfigs = configs;
  // Define the default config to use
  CodeEditor =
    defaultConfig && CodeEditorConfigs[defaultConfig]
      ? CodeEditorConfigs[defaultConfig]
      : Object.values(CodeEditorConfigs)[0];
}

export { CodeEditor, CodeEditorConfigs };
