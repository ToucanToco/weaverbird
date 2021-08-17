<template>
  <div class="widget-relative-date-form">
    <InputNumberWidget :min="1" />
    <AutocompleteWidget :options="durations" />
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';

import AutocompleteWidget from '@/components/stepforms/widgets/Autocomplete.vue';
import InputNumberWidget from '@/components/stepforms/widgets/InputNumber.vue';
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

  get durations(): string[] {
    return this.availableVariables.map(v => v.label);
  }
}
</script>

<style scoped lang="scss">
@import '../../../../styles/variables';
</style>
