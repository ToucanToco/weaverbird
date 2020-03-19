<template>
  <div class="widget-input-text__container" :class="toggleClassErrorWarning">
    <label v-if="name" :for="id">{{ name }}</label>
    <input
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
  name: 'input-text-widget',
})
export default class InputTextWidget extends Mixins(FormWidget) {
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
      'widget-input-text': true,
      'widget-input-text--focused': this.isFocused,
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

.widget-input-text__container {
  @extend %form-widget__container;
}

.widget-input-text {
  @extend %form-widget__field;
}

.widget-input-text--focused {
  @extend %form-widget__field--focused;
}

.widget-input-text__container label {
  @extend %form-widget__label;
}
</style>
