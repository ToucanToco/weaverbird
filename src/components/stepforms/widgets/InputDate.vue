<template>
  <div class="widget-input-date__container" :class="toggleClassErrorWarning">
    <div class="widget-input-date__label">
      <label v-if="name" @click="$refs.input.focus()">{{ name }}</label>
      <a v-if="docUrl" :href="docUrl" target="_blank" rel="noopener">
        <i class="fas fa-question-circle" aria-hidden="true" />
      </a>
    </div>
    <VariableInput
      :value="parsedValue"
      :available-variables="availableVariables"
      :variable-delimiters="variableDelimiters"
      :has-arrow="true"
      @input="updateValue"
    >
      <input
        ref="input"
        class="widget-input-date"
        :placeholder="placeholder"
        type="date"
        :value="parsedValue"
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
import VariableInput from './VariableInput.vue';

@Component({
  name: 'input-date-widget',
  components: {
    VariableInput,
  },
})
export default class InputDateWidget extends Mixins(FormWidget) {
  @Prop({ type: String, default: '' })
  name!: string;

  @Prop({ type: String, default: '' })
  placeholder!: string;

  @Prop({ default: '' })
  value!: string | Date;

  @Prop({ default: undefined })
  docUrl!: string | undefined;

  @Prop()
  availableVariables?: VariablesBucket;

  @Prop()
  variableDelimiters?: VariableDelimiters;

  get parsedValue(): string {
    return this.value instanceof Date ? this.parseDateToString(this.value) : this.value;
  }

  parseDateToString(date: Date): string {
    // transform a date to the expected date input string with format (YYYY-MM-DD)
    return date.toISOString().substr(0, 10);
  }

  updateValue(newValue: string): void {
    this.$emit('input', newValue);
  }
}
</script>

<style lang="scss" scoped>
@import '../../../styles/_variables';

.widget-input-date__container {
  @extend %form-widget__container;
}

.widget-input-date {
  @extend %form-widget__field;

  &:focus-within {
    @extend %form-widget__field--focused;
  }
}

.widget-input-date__label {
  align-items: flex-start;
  display: flex;
  justify-content: space-between;
  width: 100%;
}

.widget-input-date__label label {
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
