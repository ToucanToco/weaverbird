<template>
  <div class="widget-relative-date-range-form">
    <div class="widget-relative-date-range-form__container">
      <InputNumberWidget
        class="widget-relative-date-range-form__quantity"
        v-model="quantity"
        :min="1"
      />
      <AutocompleteWidget
        class="widget-relative-date-range-form__duration"
        v-model="duration"
        :options="durations"
        trackBy="value"
        label="label"
      />
    </div>
    <div class="widget-relative-date-range-form__container">
      <AutocompleteWidget
        class="widget-relative-date-range-form__input widget-relative-date-range-form__input--direction"
        v-model="rangeDirection"
        :options="directions"
        label="label"
      />
      <AutocompleteWidget
        class="widget-relative-date-range-form__input widget-relative-date-range-form__input--base-date"
        v-model="baseDate"
        :options="availableVariables"
        placeholder="Select a date"
        trackBy="identifier"
        label="label"
      />
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';

import AutocompleteWidget from '@/components/stepforms/widgets/Autocomplete.vue';
import InputNumberWidget from '@/components/stepforms/widgets/InputNumber.vue';
import { DEFAULT_DURATIONS, DurationOption, RelativeDateRange } from '@/lib/dates';
import {
  AvailableVariable,
  extractVariableIdentifier,
  VariableDelimiters,
  VariablesBucket,
} from '@/lib/variables';

/**
 * This component return a relative date range between a date variable and a relative date returned by RelativeDateForm
 */
@Component({
  name: 'relative-date-range-form',
  components: {
    InputNumberWidget,
    AutocompleteWidget,
  },
})
export default class RelativeDateRangeForm extends Vue {
  @Prop({ default: () => [] })
  availableVariables!: VariablesBucket;

  @Prop({ default: () => ({ start: '', end: '' }) })
  variableDelimiters!: VariableDelimiters;

  @Prop({ default: () => ({ date: '', quantity: -1, duration: 'year' }) })
  value!: RelativeDateRange;

  get quantity(): number {
    return Math.abs(this.value.quantity);
  }

  set quantity(quantity: number) {
    this.$emit('input', {
      ...this.value,
      quantity: quantity * Math.sign(this.rangeDirection.value),
    });
  }

  get durations(): DurationOption[] {
    return DEFAULT_DURATIONS;
  }

  get duration(): DurationOption | undefined {
    return this.durations.find(v => v.value === this.value.duration);
  }

  set duration(duration: DurationOption | undefined) {
    this.$emit('input', { ...this.value, duration: duration?.value });
  }

  get baseDate(): AvailableVariable | undefined {
    const identifier = extractVariableIdentifier(this.value.date, this.variableDelimiters);
    return this.availableVariables.find(v => v.identifier === identifier);
  }

  set baseDate(variable: AvailableVariable | undefined) {
    const value = `${this.variableDelimiters.start}${variable?.identifier}${this.variableDelimiters.end}`;
    this.$emit('input', { ...this.value, date: value });
  }

  get directions() {
    return [
      { label: 'before', value: -1 },
      { label: 'after', value: +1 },
    ];
  }

  get rangeDirection() {
    return this.value.quantity >= 0 ? this.directions[1] : this.directions[0];
  }

  set rangeDirection(direction: { label: string; value: number }) {
    this.$emit('input', {
      ...this.value,
      quantity: Math.sign(direction.value) * Math.abs(this.value.quantity),
    });
  }
}
</script>

<style scoped lang="scss">
@import '../../../../styles/variables';

.widget-relative-date-range-form__container {
  display: flex;
  justify-content: center;
  margin-bottom: 15px;
}

.widget-relative-date-range-form__quantity {
  flex: 1 25%;
  margin: 0 !important;
  background: white;

  ::v-deep .widget-input-number__container {
    margin: 0;
  }

  ::v-deep .widget-input-number {
    padding: 8px 12px;
  }
}
.widget-relative-date-range-form__duration {
  flex: 1 75%;
  margin: 0 0 0 15px;
  background: white;

  ::v-deep .multiselect__tags {
    padding: 8px 12px;
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
  flex: 1 100%;
}

.widget-relative-date-range-form__input--direction {
  flex: 1 0 25%;
  margin-right: 15px;
}

.widget-relative-date-range-form__input--base-date {
  background: white;
  margin: 0;

  ::v-deep .multiselect__tags {
    padding: 8px 12px;
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
