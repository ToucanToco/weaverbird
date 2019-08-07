<template>
  <div class="widget-input-text__container">
    <label v-if="name" :for="id">{{name}}</label>
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
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
@Component({
  name: 'input-text-widget',
})
export default class InputTextWidget extends Vue {
  @Prop({ type: String, default: null })
  id!: string;

  @Prop({ type: String, default: '' })
  name!: string;

  @Prop({ type: String, default: '' })
  placeholder!: string;

  @Prop({ default: '' })
  value!: string | number | boolean;

  isFocused: boolean = false;

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
