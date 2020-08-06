<template>
  <div class="widget-input-number__container" :class="toggleClassErrorWarning">
    <div class="widget-input-number__container">
      <label v-if="name" @click="$refs.input.focus()">{{ name }}</label>
      <a v-if="docUrl" :href="docUrl" target="_blank" rel="noopener">
        <i class="fas fa-question-circle" />
      </a>
    </div>
    <VariableInput
      :value="value"
      :available-variables="availableVariables"
      :variable-delimiters="variableDelimiters"
      :has-arrow="true"
      @input="updateValue"
    >
      <input
        ref="input"
        :class="elementClass"
        :placeholder="placeholder"
        type="number"
        :min="min"
        :max="max"
        :value="value"
        @blur="blur()"
        @focus="focus()"
        @input="updateValue($event.target.value)"
      />
    </VariableInput>
    <div v-if="messageError" class="field__msg-error">
      <span class="fa fa-exclamation-circle" />
      {{ messageError }}
    </div>
    <div v-if="messageWarning" class="field__msg-warning">
      <span class="fas fa-exclamation-triangle" />
      {{ messageWarning }}
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Mixins, Prop } from 'vue-property-decorator';

import { VariableDelimiters, VariablesBucket } from '@/lib/variables';

import FormWidget from './FormWidget.vue';
import VariableInput from './VariableInput/VariableInput.vue';

@Component({
  name: 'input-number-widget',
  components: {
    VariableInput,
  },
})
export default class InputNumberWidget extends Mixins(FormWidget) {
  @Prop({ type: String, default: '' })
  name!: string;

  @Prop({ type: String, default: '' })
  placeholder!: string;

  @Prop({ default: '' })
  value!: string | number | boolean;

  @Prop({ default: undefined })
  docUrl!: string | undefined;

  @Prop({ type: Number, default: undefined })
  min!: number;

  @Prop({ type: Number, default: undefined })
  max!: number;

  @Prop()
  availableVariables!: VariablesBucket;

  @Prop()
  variableDelimiters!: VariableDelimiters;

  isFocused = false;

  get elementClass() {
    return {
      'widget-input-number': true,
      'widget-input-number--focused': this.isFocused,
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

.widget-input-number__container {
  @extend %form-widget__container;
}

.widget-input-number {
  @extend %form-widget__field;
  padding: 8px;
}

.widget-input-number--focused {
  @extend %form-widget__field--focused;
}

.widget-input-number__container {
  align-items: flex-start;
  display: flex;
  justify-content: space-between;
  width: 100%;
}

.widget-input-number__container label {
  @extend %form-widget__label;
}

.fas.fa-question-circle {
  margin-left: 5px;
  color: $base-color;
  font-size: 14px;

  &:hover {
    color: $active-color;
  }
}
</style>
