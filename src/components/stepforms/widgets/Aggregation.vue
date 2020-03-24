<template>
  <fieldset class="widget-aggregation__container">
    <AutocompleteWidget
      id="columnInput"
      :options="columnNames"
      v-model="aggregationColumn"
      name="Column:"
      placeholder="Enter a column"
      :data-path="`${dataPath}.column`"
      :errors="errors"
    />
    <AutocompleteWidget
      id="aggregationFunctionInput"
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
