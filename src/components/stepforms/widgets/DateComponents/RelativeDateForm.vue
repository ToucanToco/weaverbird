<template>
  <div class="widget-relative-date-form">
    <InputNumberWidget class="widget-relative-date-form__quantity" v-model="quantity" :min="1" />
    <AutocompleteWidget
      class="widget-relative-date-form__duration"
      v-model="duration"
      :options="durations"
    />
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';

import AutocompleteWidget from '@/components/stepforms/widgets/Autocomplete.vue';
import InputNumberWidget from '@/components/stepforms/widgets/InputNumber.vue';
import { DEFAULT_DURATIONS, RelativeDate } from '@/lib/dates';
import { VariablesBucket } from '@/lib/variables';
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
export default class CustomVariableList extends Vue {
  @Prop({ default: () => DEFAULT_DURATIONS })
  availableVariables!: VariablesBucket;

  @Prop({ default: () => ({ quantity: 1, duration: DEFAULT_DURATIONS[0].label }) })
  value!: RelativeDate;

  get quantity(): number {
    return this.value.quantity ?? 1;
  }

  set quantity(quantity: number) {
    this.$emit('input', { ...this.value, quantity });
  }

  get durations(): string[] {
    return this.availableVariables.map(v => v.label);
  }

  // retrieve duration label to give correct value to autocomplete
  get duration(): string | undefined {
    const duration = this.availableVariables.find(v => v.identifier === this.value.duration)?.label;
    return duration ?? this.durations[0];
  }

  // retrieve duration identifier to give correct value on emit
  set duration(label: string | undefined) {
    const duration = this.availableVariables.find(v => v.label === label)?.identifier;
    this.$emit('input', { ...this.value, duration });
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
