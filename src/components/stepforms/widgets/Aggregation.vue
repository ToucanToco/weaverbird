<template>
  <fieldset class="widget-aggregation__container">
    <MultiselectWidget
      class="columnsInput"
      :options="columnNames"
      v-model="aggregationColumns"
      name="Columns:"
      placeholder="Select columns"
      :data-path="`${dataPath}.columns`"
      :errors="errors"
      :available-variables="availableVariables"
      :variable-delimiters="variableDelimiters"
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

import { Aggregation } from '@/lib/steps';
import { VariableDelimiters, VariablesBucket } from '@/lib/variables';
import { VQBModule } from '@/store';

import AutocompleteWidget from './Autocomplete.vue';
import MultiselectWidget from './Multiselect.vue';

@Component({
  name: 'aggregation-widget',
  components: {
    AutocompleteWidget,
    MultiselectWidget,
  },
})
export default class AggregationWidget extends Vue {
  @Prop({ type: String, default: null })
  dataPath!: string;

  @Prop({ type: Object, default: () => ({ columns: [], aggfunctions: 'sum', newcolumns: [] }) })
  value!: Aggregation;

  @Prop({ type: Array, default: () => [] })
  errors!: ErrorObject[];

  @Prop()
  availableVariables?: VariablesBucket;

  @Prop()
  variableDelimiters?: VariableDelimiters;

  @VQBModule.Getter columnNames!: string[];

  get aggregationColumns() {
    return this.value.columns;
  }

  set aggregationColumns(newAggregationColumns) {
    this.$emit('input', { ...this.value, columns: newAggregationColumns });
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

  aggregationFunctions: Aggregation['aggfunction'][] = [
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

.widget-multiselect__container {
  align-items: center;
  flex-direction: row;
}
</style>
