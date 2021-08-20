<template>
  <div class="widget-relative-date-form">
    <InputNumberWidget class="widget-relative-date-form__quantity" v-model="quantity" :min="1" />
    <AutocompleteWidget
      class="widget-relative-date-form__duration"
      v-model="duration"
      :options="durations"
      trackBy="value"
      label="label"
    />
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';

import AutocompleteWidget from '@/components/stepforms/widgets/Autocomplete.vue';
import InputNumberWidget from '@/components/stepforms/widgets/InputNumber.vue';
import { DEFAULT_DURATIONS, DurationOption, RelativeDate } from '@/lib/dates';
/**
 * This component return a relative date composed from a number and a "duration" variable
 */
@Component({
  name: 'relative-date-form',
  components: {
    InputNumberWidget,
    AutocompleteWidget,
  },
})
export default class RelativeDateForm extends Vue {
  @Prop({
    default: () => ({ quantity: -1, duration: DEFAULT_DURATIONS[0].value }),
  })
  value!: RelativeDate;

  get quantity(): number {
    return Math.abs(this.value.quantity);
  }

  set quantity(quantity: number) {
    // duration is always past time so quantity should be negative
    this.$emit('input', { ...this.value, quantity: quantity * -1 });
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
}
</script>

<style scoped lang="scss">
$active-color: #16406a;
$active-color-light: #dde6f0;
$active-color-extra-light: #f8f7fa;

.widget-relative-date-form {
  display: flex;
  align-items: center;
  justify-content: center;
}
.widget-relative-date-form__quantity {
  flex: 1 25%;
  margin: 0;
  background: $active-color-extra-light;

  ::v-deep .widget-input-number__container {
    margin: 0;
  }

  ::v-deep .widget-input-number {
    padding: 8px 12px;
  }
}
.widget-relative-date-form__duration {
  flex: 1 75%;
  margin: 0 0 0 15px;
  background: $active-color-extra-light;

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
