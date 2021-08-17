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
import { RelativeDate } from '@/lib/dates';
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
  @Prop({ default: () => [] })
  availableVariables!: VariablesBucket;

  @Prop({ default: () => ({}) })
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
@import '../../../../styles/variables';
</style>
