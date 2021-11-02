<template>
  <div class="widget-relative-date-range-form">
    <div class="widget-relative-date-range-form__container">
      <RelativeDateForm class="widget-relative-date-range-form__input" v-model="rangeSize" />
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

  get rangeSize(): RelativeDate {
    return _pick(this.value, ['quantity', 'duration']);
  }

  set rangeSize(to: RelativeDate) {
    this.$emit('input', { ...this.value, ...to });
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
      { label: 'before', value: 'before' },
      { label: 'after', value: 'after' },
    ];
  }

  get rangeDirection() {
    return this.value.quantity >= 0 ? this.directions[1] : this.directions[0];
  }
}
</script>

<style scoped lang="scss">
@import '../../../../styles/variables';

.widget-relative-date-range-form__container {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 15px;
}

.widget-relative-date-range-form__input {
  flex: 1 100%;
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
