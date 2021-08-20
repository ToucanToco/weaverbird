<template>
  <div class="widget-relative-date-range-form">
    <div class="widget-relative-date-range-form__container">
      <p class="widget-relative-date-range-form__label">From</p>
      <AutocompleteWidget
        class="widget-relative-date-range-form__input widget-relative-date-range-form__input--from"
        v-model="from"
        :options="availableVariables"
        placeholder="Select a date"
        trackBy="identifier"
        label="label"
      />
    </div>
    <div class="widget-relative-date-range-form__container">
      <p class="widget-relative-date-range-form__label">to</p>
      <RelativeDateForm class="widget-relative-date-range-form__input" v-model="to" />
    </div>
  </div>
</template>

<script lang="ts">
import _pick from 'lodash/pick';
import { Component, Prop, Vue } from 'vue-property-decorator';

import AutocompleteWidget from '@/components/stepforms/widgets/Autocomplete.vue';
import { RelativeDate, RelativeDateRange } from '@/lib/dates';
import {
  AvailableVariable,
  extractVariableIdentifier,
  VariableDelimiters,
  VariablesBucket,
} from '@/lib/variables';

import RelativeDateForm from './RelativeDateForm.vue';
/**
 * This component return a relative date range between a date variable and a relative date returned by RelativeDateForm
 */
@Component({
  name: 'relative-date-range-form',
  components: {
    RelativeDateForm,
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

  get to(): RelativeDate {
    return _pick(this.value, ['quantity', 'duration']);
  }

  set to(to: RelativeDate) {
    this.$emit('input', { ...this.value, ...to });
  }

  get from(): AvailableVariable | undefined {
    const identifier = extractVariableIdentifier(this.value.date, this.variableDelimiters);
    return this.availableVariables.find(v => v.identifier === identifier);
  }

  set from(variable: AvailableVariable | undefined) {
    const value = `${this.variableDelimiters.start}${variable?.identifier}${this.variableDelimiters.end}`;
    this.$emit('input', { ...this.value, date: value });
  }
}
</script>

<style scoped lang="scss">
$active-color: #16406a;
$active-color-light: #dde6f0;
$active-color-extra-light: #f8f7fa;

.widget-relative-date-range-form__container {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 15px;
}

.widget-relative-date-range-form__label {
  flex: 1 0;
  font-size: 14px;
  font-family: 'Montserrat', sans-serif;
  margin-right: 10px;
  min-width: 40px;
}

.widget-relative-date-range-form__input {
  flex: 1 100%;
}

.widget-relative-date-range-form__input--from {
  background: $active-color-extra-light;
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
    background: $active-color-extra-light;
    color: $active-color;
  }

  ::v-deep .multiselect__option--selected {
    background: $active-color-light;
    color: $active-color;
  }
}
</style>
