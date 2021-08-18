<template>
  <div class="widget-relative-date-range-form">
    <AutocompleteWidget
      v-model="from"
      :options="availableVariables"
      trackBy="identifier"
      label="label"
    />
    <RelativeDateForm v-model="to" />
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';

import AutocompleteWidget from '@/components/stepforms/widgets/Autocomplete.vue';
import { RelativeDate, RelativeDateRange } from '@/lib/dates';
import { AvailableVariable, VariablesBucket } from '@/lib/variables';

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

  @Prop({ default: () => [undefined, { date: undefined, quantity: -1, duration: 'year' }] })
  value!: RelativeDateRange;

  get to(): RelativeDate {
    return this.value[1];
  }

  set to(to: RelativeDate) {
    this.$emit('input', [this.value[0], to]);
  }

  get from(): AvailableVariable | undefined {
    return this.availableVariables.find(v => v.identifier === this.value[0]);
  }

  set from(variable: AvailableVariable | undefined) {
    const value = variable?.identifier;
    this.$emit('input', [value, { ...this.to, date: value }]);
  }
}
</script>

<style scoped lang="scss"></style>
