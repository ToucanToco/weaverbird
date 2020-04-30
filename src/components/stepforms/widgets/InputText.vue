<template>
  <div class="widget-input-text__container" :class="[toggleClassErrorWarning, variableInputClass]">
    <div class="widget-input-text__label">
      <label v-if="name" @click="$refs.input.focus()">{{ name }}</label>
      <a v-if="docUrl" :href="docUrl" target="_blank" rel="noopener">
        <i class="fas fa-question-circle" />
      </a>
    </div>
    <div v-if="!isVariableInputActive" style="width: 100%; position: relative">
      <input
        ref="input"
        :class="elementClass"
        :placeholder="placeholder"
        type="text"
        :value="value"
        @blur="blur()"
        @focus="focus()"
        @input="updateValue($event.target.value)"
      />
      <span
        v-if="variable"
        :class="['variable-toggle', variableToggleClass]"
        @click="updateValue('', true)"
        >x</span
      >
    </div>
    <VariableInput
      v-else
      :value="currentVariableName"
      @input="updateValue($event, true)"
      @removed="updateValue('', false)"
    />
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

import FormWidget from './FormWidget.vue';
import VariableInput from './VariableInput.vue';

@Component({
  name: 'input-text-widget',
  components: {
    VariableInput,
  },
})
export default class InputTextWidget extends Mixins(FormWidget) {
  @Prop({ type: String, default: '' })
  name!: string;

  @Prop({ type: String, default: '' })
  placeholder!: string;

  @Prop({ default: '' })
  value!: string | number | boolean;

  @Prop({ default: undefined })
  docUrl!: string | undefined;

  /**
   * boolean to determine if input should propose variable or not
   */
  @Prop({ type: Boolean, default: false })
  variable!: boolean;

  isFocused = false;

  get elementClass() {
    return {
      'widget-input-text': true,
      'widget-input-text--focused': this.isFocused,
    };
  }

  get variableInputClass() {
    return { 'widget-input-text__container--with-variable': this.isVariableInputActive };
  }

  get variableToggleClass() {
    return { 'variable-toggle--focused': this.isFocused };
  }

  blur() {
    this.isFocused = false;
  }

  focus() {
    this.isFocused = true;
  }

  updateValue(newValue?: string, isVariable = false) {
    console.log('updateValue>newValue', newValue);
    console.log('updateValue>isVariable', isVariable);
    if (isVariable && newValue !== undefined) {
      this.$emit('input', `<%=${newValue}%>`);
    } else {
      this.$emit('input', newValue);
    }
  }

  get currentVariableName() {
    if (typeof this.value != 'string') {
      return undefined;
    }
    return this.value.replace('<%=', '').replace('%>', '');
  }

  get isVariableInputActive() {
    if (typeof this.value != 'string') {
      return false;
    }
    return this.value.startsWith('<%=') && this.value.endsWith('%>');
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

.widget-input-text__label {
  align-items: flex-start;
  display: flex;
  justify-content: space-between;
  width: 100%;
}

.widget-input-text__label label {
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

.variable-toggle {
  font-family: cursive;
  opacity: 0;
  visibility: hidden;
  display: block;
  position: absolute;
  top: 0;
  bottom: 0;
  margin: auto;
  right: 10px;
  width: 18px;
  height: 18px;
  background: #eaeff5;
  color: rgb(38, 101, 163);
  border-radius: 50%;
  line-height: 16px;
  font-size: 14px;
  text-align: center;
  transition: 250ms all ease-in;
  cursor: pointer;
  &:hover {
    background: rgb(38, 101, 163);
    color: #eaeff5;
  }
}

.variable-toggle--focused {
  opacity: 1;
  visibility: visible;
}
</style>
