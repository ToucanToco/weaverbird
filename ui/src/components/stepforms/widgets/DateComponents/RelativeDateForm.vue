<template>
  <div class="widget-relative-date-range-form" data-cy="weaverbird-date-input-relative-form">
    <div class="widget-relative-date-range-form__container">
      <InputNumberWidget
        class="widget-relative-date-range-form__quantity"
        data-cy="weaverbird-date-input-relative-form-quantity"
        v-model="quantity"
        :min="1"
      />
      <AutocompleteWidget
        class="widget-relative-date-range-form__duration"
        data-cy="weaverbird-date-input-relative-form-duration"
        v-model="duration"
        :options="durations"
        trackBy="value"
        label="label"
      />
    </div>
    <div class="widget-relative-date-range-form__container">
      <AutocompleteWidget
        class="widget-relative-date-range-form__input widget-relative-date-range-form__input--operator"
        data-cy="weaverbird-date-input-relative-form-operator"
        v-model="operator"
        :options="availableOperators"
        label="label"
      />
      <AutocompleteWidget
        class="widget-relative-date-range-form__input widget-relative-date-range-form__input--base-date"
        data-cy="weaverbird-date-input-relative-form-date"
        v-model="baseDate"
        :options="availableVariables"
        placeholder="Select a date"
        trackBy="identifier"
        label="label"
        :maxHeight="240"
      />
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';

import AutocompleteWidget from '@/components/stepforms/widgets/Autocomplete.vue';
import InputNumberWidget from '@/components/stepforms/widgets/InputNumber.vue';
import { DEFAULT_DURATIONS, RELATIVE_DATE_OPERATORS } from '@/lib/dates';
import type { DurationOption, RelativeDate } from '@/lib/dates';
import { extractVariableIdentifier, isTrustedVariable } from '@/lib/variables';
import type { AvailableVariable, VariableDelimiters, VariablesBucket } from '@/lib/variables';

/**
 * This component return a relative date between a date variable and a relative date returned by RelativeDateForm
 */
@Component({
  name: 'relative-date-range-form',
  components: {
    InputNumberWidget,
    AutocompleteWidget,
  },
})
export default class RelativeDateForm extends Vue {
  @Prop({ default: () => [] })
  availableVariables!: VariablesBucket;

  @Prop({ default: () => ({ start: '', end: '' }) })
  variableDelimiters!: VariableDelimiters;

  @Prop({ default: undefined })
  trustedVariableDelimiters!: VariableDelimiters;

  @Prop({ default: () => ({ date: '', quantity: 1, duration: 'year', operator: 'until' }) })
  value!: RelativeDate;

  get quantity(): number {
    return Math.abs(this.value.quantity);
  }

  set quantity(quantity: number) {
    this.$emit('input', {
      ...this.value,
      quantity: quantity,
    });
  }

  get durations(): DurationOption[] {
    return DEFAULT_DURATIONS;
  }

  get duration(): DurationOption | undefined {
    return this.durations.find((v) => v.value === this.value.duration);
  }

  set duration(duration: DurationOption | undefined) {
    this.$emit('input', { ...this.value, duration: duration?.value });
  }

  get baseDate(): AvailableVariable | undefined {
    const identifier = extractVariableIdentifier(
      this.value.date,
      this.variableDelimiters,
      this.trustedVariableDelimiters,
    );
    return this.availableVariables.find((v) => v.identifier === identifier);
  }

  set baseDate(variable: AvailableVariable | undefined) {
    // use correct delimiters depending on if the variable is trusted or not
    const attendedVariableDelimiters = isTrustedVariable(variable)
      ? this.trustedVariableDelimiters
      : this.variableDelimiters;
    const value = `${attendedVariableDelimiters.start}${variable?.identifier}${attendedVariableDelimiters.end}`;
    this.$emit('input', { ...this.value, date: value });
  }

  get availableOperators() {
    return [RELATIVE_DATE_OPERATORS.until, RELATIVE_DATE_OPERATORS.from];
  }

  get operator() {
    // Current value should have an operator but we introduced it without at first,
    // relying entierly on quantity's sign to encode it.
    // We keep this fallback as a reminder of this mistake until someone decide that comments
    // is not the place for keeping track of our stuttering torward Clean Code :tm:
    const fallbackOperator =
      this.value.quantity >= 0 ? RELATIVE_DATE_OPERATORS.from : RELATIVE_DATE_OPERATORS.until;
    return (
      this.availableOperators.find((op) => op.label === this.value.operator) ?? fallbackOperator
    );
  }

  set operator(operator: { label: string; sign: number }) {
    this.$emit('input', {
      ...this.value,
      operator: operator.label,
      quantity: this.quantity,
    });
  }
}
</script>

<style scoped lang="scss">
@import '../../../../styles/variables';

.widget-relative-date-range-form__container {
  display: flex;
  justify-content: center;
  margin: 5px;
}

.widget-relative-date-range-form__quantity {
  flex: 0 0 75px;
  margin: 0;
  margin-right: 5px;
  background: white;

  ::v-deep .widget-input-number__container {
    margin: 0;
  }

  ::v-deep .widget-input-number {
    padding: 8px 12px;
  }
}
.widget-relative-date-range-form__duration {
  flex: 1;
  margin: 0;
  background: white;
  // Default min-width for flex items is auto.
  // Override this value to prevent the element overflowing the container.
  min-width: 0;

  ::v-deep .multiselect__tags {
    padding: 8px 12px;
  }

  ::v-deep .multiselect__content {
    max-width: 100%;
  }

  ::v-deep .option__title {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  ::v-deep .multiselect__option {
    border: none;
    margin: 5px;
    border-radius: 2px;
    max-height: 30px;
    padding: 8px 15px;
    line-height: 25px;
    box-shadow: none;
  }

  ::v-deep .multiselect__option--highlight {
    background: var(--weaverbird-theme-main-color-extra-light, $active-color-faded-3);
    color: var(--weaverbird-theme-main-color, $active-color);
  }

  ::v-deep .multiselect__option--selected {
    background: var(--weaverbird-theme-main-color-light, $active-color-faded-2);
    color: var(--weaverbird-theme-main-color, $active-color);
  }
}

.widget-relative-date-range-form__input {
  flex: 1;
  // Default min-width for flex items is auto.
  // Override this value to prevent the element overflowing the container.
  min-width: 0;
}

.widget-relative-date-range-form__input--operator {
  flex: 0 0 75px;
  margin-right: 5px;
}

.widget-relative-date-range-form__input--base-date {
  background: white;
  margin: 0;

  ::v-deep .multiselect__tags {
    padding: 8px 12px;
  }

  ::v-deep .multiselect__placeholder {
    display: block;
    line-height: 24px;
    padding: 0;
  }

  ::v-deep .multiselect__option {
    border: none;
    margin: 5px;
    border-radius: 2px;
    max-height: 30px;
    padding: 8px 15px;
    line-height: 25px;
    box-shadow: none;
  }

  ::v-deep .multiselect__option--highlight {
    background: var(--weaverbird-theme-main-color-extra-light, $active-color-faded-3);
    color: var(--weaverbird-theme-main-color, $active-color);
  }

  ::v-deep .multiselect__option--selected {
    background: var(--weaverbird-theme-main-color-light, $active-color-faded-2);
    color: var(--weaverbird-theme-main-color, $active-color);
  }
}
</style>
