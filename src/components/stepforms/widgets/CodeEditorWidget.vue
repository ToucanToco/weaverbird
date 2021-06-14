<template>
  <div class="widget-code-editor__container" :class="toggleClassErrorWarning">
    <label v-if="name">{{ name }}</label>
    <component
      :is="codeEditor"
      :class="elementClass"
      :placeholder="placeholder"
      v-model="editedValue"
      @blur="blur()"
      @focus="focus()"
    />
    <div v-if="messageError" class="field__msg-error">
      <span class="fa fa-exclamation-circle" />{{ messageError }}
    </div>
    <div v-if="messageWarning" class="field__msg-warning">
      <span class="fas fa-exclamation-triangle" />{{ messageWarning }}
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Mixins, Prop, Watch } from 'vue-property-decorator';

import { CodeEditor, CodeEditorConfig, CodeEditorConfigs } from '@/components/code-editor';

import FormWidget from './FormWidget.vue';

@Component({
  name: 'code-editor-widget',
})
export default class CodeEditorWidget extends Mixins(FormWidget) {
  @Prop({ type: String, default: '' })
  name!: string;

  @Prop({ type: String, default: '' })
  placeholder!: string;

  @Prop({ default: '' })
  value!: string;

  @Prop({ type: String, default: '' })
  config!: string;

  editedValue = this.value;

  isFocused = false;

  // Code editor is set through a responsive data so it can be change after import
  codeEditor: CodeEditorConfig = CodeEditor;

  @Watch('editedValue')
  updateValue(newValue: string) {
    this.$emit('input', newValue);
  }

  get elementClass() {
    return {
      'widget-code-editor': true,
      'widget-code-editor--focused': this.isFocused,
    };
  }

  created() {
    this.setEditorConfig();
  }

  /*
  Use a specific config of AvailableCodeEditors
  */
  setEditorConfig() {
    if (this.config && CodeEditorConfigs[this.config]) {
      this.codeEditor = CodeEditorConfigs[this.config];
    }
  }

  blur() {
    this.isFocused = false;
  }

  focus() {
    this.isFocused = true;
  }
}
</script>

<style lang="scss" scoped>
@import '../../../styles/_variables';

.widget-code-editor__container {
  @extend %form-widget__container;
  height: 300px;
}

.widget-code-editor {
  border: 1px #f1f1f1 solid;
  transition: border 0.25s;
  margin: 5px 0px;
  width: 100%;
  height: 100%;
  resize: none;
  font-size: 15px;
}

.widget-code-editor--focused {
  border: 1px $active-color solid;
  transition: border 0.25s;
}

.widget-code-editor__container label {
  @extend %form-widget__label;
}
</style>
