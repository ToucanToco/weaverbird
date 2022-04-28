<template>
  <fieldset class="widget-aggregation__container">
    <legend>Aggregate column</legend>
    <AutocompleteWidget
      class="columnInput"
      v-model="column"
      name="Column:"
      :options="columnNames"
      placeholder="Column"
      :data-path="`${dataPath}.column`"
      :errors="errors"
    />
    <AutocompleteWidget
      class="aggregationFunctionInput"
      v-model="aggregationFunction"
      name="Function:"
      :options="aggregationFunctions"
      placeholder="Aggregation function"
      :data-path="`${dataPath}.agg_function`"
      :errors="errors"
    />
  </fieldset>
</template>
<script lang="ts">
import { ErrorObject } from 'ajv';
import { Component, Prop, Vue } from 'vue-property-decorator';

import { DissolveAggregation } from '@/lib/steps';
import { VariableDelimiters, VariablesBucket } from '@/lib/variables';
import { VQBModule } from '@/store';

import AutocompleteWidget from './Autocomplete.vue';
import MultiselectWidget from './Multiselect.vue';

@Component({
  name: 'dissolve-aggregation-widget',
  components: {
    AutocompleteWidget,
    MultiselectWidget,
  },
})
export default class DissolveAggregationWidget extends Vue {
  @Prop({ type: String, default: null })
  dataPath!: string;

  @Prop({ type: Object, default: () => ({ column: '', agg_function: 'sum' }) })
  value!: DissolveAggregation;

  @Prop({ type: Array, default: () => [] })
  errors!: ErrorObject[];

  @Prop()
  availableVariables?: VariablesBucket;

  @Prop()
  variableDelimiters?: VariableDelimiters;

  @VQBModule.Getter columnNames!: string[];

  set column(newAggregationColumn) {
    this.$emit('input', { ...this.value, column: newAggregationColumn });
  }

  get column() {
    return this.value.column;
  }

  get aggregationFunction() {
    return this.value.agg_function;
  }

  set aggregationFunction(newAggregationFunction) {
    this.$emit('input', {
      ...this.value,
      agg_function: newAggregationFunction,
    });
  }

  aggregationFunctions: Aggregation['aggfunction'][] = [
    'sum',
    'avg',
    'count',
    'count distinct',
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
  padding: 0;
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
.widget-aggregation__container > legend {
  display: none;
}
</style>
