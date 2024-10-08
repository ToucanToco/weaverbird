<template>
  <AutocompleteWidget
    :value="value"
    :name="name"
    :options="columnNames"
    @input="valueChanged"
    :placeholder="placeholder"
    :data-path="dataPath"
    :errors="errors"
    :available-variables="availableVariables"
    :variable-delimiters="variableDelimiters"
    :trusted-variable-delimiters="trustedVariableDelimiters"
    :allowCustom="true"
  />
</template>

<script lang="ts">
import type { ErrorObject } from 'ajv';
import Vue from 'vue';
import { Component, Prop, Watch } from 'vue-property-decorator';

import AutocompleteWidget from '@/components/stepforms/widgets/Autocomplete.vue';
import type { VariableDelimiters, VariablesBucket } from '@/lib/variables';

@Component({ components: { AutocompleteWidget } })
export default class ColumnPicker extends Vue {
  @Prop({ type: String, default: 'column' })
  name!: string;

  @Prop({ type: String, default: 'Enter a column' })
  placeholder!: string;

  @Prop({ type: Array, default: () => [] })
  errors!: ErrorObject[];

  @Prop({ default: null })
  dataPath!: string;

  @Prop({ default: null })
  value!: string;

  @Prop()
  availableVariables?: VariablesBucket;

  @Prop()
  variableDelimiters?: VariableDelimiters;

  @Prop()
  trustedVariableDelimiters?: VariableDelimiters;

  // Whether the column data of ColumnPicker should react to a change of
  // selected column
  @Prop({ default: true })
  syncWithSelectedColumn!: boolean;

  @Prop({ default: () => [] })
  selectedColumns!: string[];

  @Prop({ default: () => [] })
  columnNames!: string[];

  created() {
    if (this.syncWithSelectedColumn && this.selectedColumns[0] && !this.value) {
      this.$emit('input', this.selectedColumns[0]);
    }
  }

  @Watch('selectedColumns')
  onSelectedColumnsChanged() {
    if (
      this.syncWithSelectedColumn &&
      this.selectedColumns[0] &&
      this.selectedColumns[0] !== this.value
    ) {
      this.$emit('input', this.selectedColumns[0]);
    }
  }

  valueChanged(newColumn: string) {
    this.$emit('input', newColumn);
    if (this.syncWithSelectedColumn) {
      this.$emit('setSelectedColumns', { column: newColumn });
    }
  }
}
</script>
