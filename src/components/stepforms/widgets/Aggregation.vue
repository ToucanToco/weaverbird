<template>
  <fieldset class="widget-aggregation__container">
    <AutocompleteWidget
      id="columnInput"
      :options="columnNames"
      v-model="aggregation.column"
      name="Column:"
      placeholder="Enter a column"
      :data-path="`${dataPath}.column`"
      :errors="errors"
    />
    <AutocompleteWidget
      id="aggregationFunctionInput"
      v-model="aggregation.aggfunction"
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
import _ from 'lodash';
import { Component, Prop, Vue, Watch } from 'vue-property-decorator';

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

  aggregation: AggFunctionStep = { ...this.value };
  aggregationFunctions: AggFunctionStep['aggfunction'][] = ['sum', 'avg', 'count', 'min', 'max'];

  @Watch('aggregation', { immediate: true, deep: true })
  onAggregationChanged(newval: AggFunctionStep, oldval: AggFunctionStep) {
    if (!_.isEqual(newval, oldval)) {
      this.$emit('input', this.aggregation);
    }
  }
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
