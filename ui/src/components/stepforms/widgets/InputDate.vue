<template>
  <div class="widget-input-date__container" :class="toggleClassErrorWarning">
    <div class="widget-input-date__label">
      <label v-if="name" @click="$refs.input.focus()">{{ name }}</label>
      <a v-if="docUrl" :href="docUrl" target="_blank" rel="noopener">
        <FAIcon class="widget-input-date__doc-icon" icon="question-circle" />
      </a>
    </div>
    <VariableInput
      :value="parsedValue"
      :available-variables="availableVariables"
      :variable-delimiters="variableDelimiters"
      :trusted-variable-delimiters="trustedVariableDelimiters"
      :has-arrow="true"
      @input="updateValue"
    >
      <input
        ref="input"
        class="widget-input-date"
        :class="{
          'widget-input--with-variables': availableVariables,
        }"
        :placeholder="placeholder"
        type="date"
        :value="parsedValue"
        @input="updateValue($event.target.value)"
      />
    </VariableInput>
    <div v-if="messageError" class="field__msg-error">
      <FAIcon icon="exclamation-circle" />
      {{ messageError }}
    </div>
    <div v-if="messageWarning" class="field__msg-warning">
      <FAIcon icon="exclamation-triangle" />
      {{ messageWarning }}
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop } from 'vue-property-decorator';

import FAIcon from '@/components/FAIcon.vue';
import type { VariableDelimiters, VariablesBucket } from '@/lib/variables';

import FormWidget from './FormWidget.vue';
import VariableInput from './VariableInput.vue';

@Component({
  name: 'input-date-widget',
  components: {
    VariableInput,
    FAIcon,
  },
})
export default class InputDateWidget extends FormWidget {
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

  @Prop()
  trustedVariableDelimiters?: VariableDelimiters;

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

.widget-input-date__doc-icon {
  margin-left: 5px;
  color: $base-color;
  font-size: 14px;

  &:hover {
    color: $active-color;
  }
}

.widget-input--with-variables {
  padding-right: 35px;
  text-overflow: ellipsis;
}
</style>
