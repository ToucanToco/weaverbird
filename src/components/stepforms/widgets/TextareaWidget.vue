<template>
  <div class="widget-textarea__container" :class="toggleClassErrorWarning">
    <label v-if="name" :for="id">{{ name }}</label>
    <textarea
      :id="id"
      :class="elementClass"
      :placeholder="placeholder"
      type="text"
      :value="value"
      @blur="blur()"
      @focus="focus()"
      @input="updateValue($event.target.value)"
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
import { Component, Mixins, Prop } from 'vue-property-decorator';

import FormWidget from './FormWidget.vue';

@Component({
  name: 'textarea-widget',
})
export default class TextareaWidget extends Mixins(FormWidget) {
  @Prop({ type: String, default: null })
  id!: string;

  @Prop({ type: String, default: '' })
  name!: string;

  @Prop({ type: String, default: '' })
  placeholder!: string;

  @Prop({ default: '' })
  value!: string | number | boolean;

  isFocused = false;

  get elementClass() {
    return {
      'widget-textarea': true,
      'widget-textarea--focused': this.isFocused,
    };
  }

  blur() {
    this.isFocused = false;
  }

  focus() {
    this.isFocused = true;
  }

  updateValue(newValue: string) {
    this.$emit('input', newValue);
  }
}
</script>

<style lang="scss" scoped>
@import '../../../styles/_variables';

.widget-textarea__container {
  @extend %form-widget__container;
}

.widget-textarea {
  @extend %form-widget__field;
}

.widget-textarea--focused {
  @extend %form-widget__field--focused;
}

.widget-textarea__container label {
  @extend %form-widget__label;
}

.widget-textarea {
  margin: 5px 0px;
  width: 100%;
  height: 300px;
  resize: none;
  font-size: 15px;
}
</style>
