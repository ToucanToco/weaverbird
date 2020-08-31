<template>
  <fieldset class="widget-aggregation__container">
    <AutocompleteWidget
      class="columnInput"
      :options="columnNames"
      v-model="aggregationColumn"
      name="Column:"
      placeholder="Enter a column"
      :data-path="`${dataPath}.column`"
      :errors="errors"
      :available-variables="availableVariables"
      :variable-delimiters="variableDelimiters"
      :advanced-variable-delimiters="advancedVariableDelimiters"
    />
    <AutocompleteWidget
      class="aggregationFunctionInput"
      v-model="aggregationFunction"
      name="Function:"
      :options="aggregationFunctions"
      placeholder="Aggregation function"
      :data-path="`${dataPath}.aggfunction`"
      :errors="errors"
    />
  </fieldset>
</template>
<script lang="ts">
import { ErrorObject } from 'ajv';
import { Component, Prop, Vue } from 'vue-property-decorator';

import { AggFunctionStep } from '@/lib/steps';
import { VariableDelimiters, VariablesBucket } from '@/lib/variables';
import { VQBModule } from '@/store';

import AutocompleteWidget from './Autocomplete.vue';

@Component({
  name: 'aggregation-widget',
  components: {
    AutocompleteWidget,
  },
})
export default class AggregationWidget extends Vue {
  @Prop({ type: String, default: null })
  dataPath!: string;

  @Prop({ type: Object, default: () => ({ column: '', aggfunction: 'sum', newcolumn: '' }) })
  value!: AggFunctionStep;

  @Prop({ type: Array, default: () => [] })
  errors!: ErrorObject[];

  @Prop()
  availableVariables!: VariablesBucket;

  @Prop()
  variableDelimiters!: VariableDelimiters;

  @Prop()
  advancedVariableDelimiters!: VariableDelimiters;

  @VQBModule.Getter columnNames!: string[];

  get aggregationColumn() {
    return this.value.column;
  }

  set aggregationColumn(newAggregationColumn) {
    this.$emit('input', {
      ...this.value,
      column: newAggregationColumn,
    });
  }

  get aggregationFunction() {
    return this.value.aggfunction;
  }

  set aggregationFunction(newAggregationFunction) {
    this.$emit('input', {
      ...this.value,
      aggfunction: newAggregationFunction,
    });
  }

  aggregationFunctions: AggFunctionStep['aggfunction'][] = [
    'sum',
    'avg',
    'count',
    'min',
    'max',
    'first',
    'last',
  ];
}
</script>
<style lang="scss" scoped>
@import '../../../styles/_variables';
.widget-aggregation__container {
  @extend %form-widget__container;
  margin-bottom: 0;
  padding-top: 12px;
  padding-bottom: 4px;
}

.widget-autocomplete__container {
  align-items: center;
  flex-direction: row;
  margin-bottom: 8px;
}
</style>
