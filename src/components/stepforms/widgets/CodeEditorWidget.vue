<template>
  <div class="widget-code-editor__container" :class="toggleClassErrorWarning">
    <label v-if="name" :for="id">{{ name }}</label>
    <component
      :is="CodeEditor"
      :id="id"
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

import { CodeEditor } from '@/components/code-editor';

import FormWidget from './FormWidget.vue';

@Component({
  name: 'code-editor-widget',
})
export default class CodeEditorWidget extends Mixins(FormWidget) {
  @Prop({ type: String, default: null })
  id!: string;

  @Prop({ type: String, default: '' })
  name!: string;

  @Prop({ type: String, default: '' })
  placeholder!: string;

  @Prop({ default: '' })
  value!: string;

  editedValue = this.value;

  isFocused = false;

  CodeEditor = CodeEditor;
  // Code editor is set through a responsive data so it can be change after import

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
}

.widget-code-editor {
  @extend %form-widget__field;
}

.widget-code-editor--focused {
  @extend %form-widget__field--focused;
}

.widget-code-editor__container label {
  @extend %form-widget__label;
}

.widget-code-editor {
  margin: 5px 0px;
  width: 100%;
  height: 300px;
  resize: none;
  font-size: 15px;
}
</style>
