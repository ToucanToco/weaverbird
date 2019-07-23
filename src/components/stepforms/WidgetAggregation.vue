<template>
  <fieldset class="widget-aggregation__container">
    <WidgetAutocomplete
      id="columnInput"
      :options="columnNames"
      v-model="aggregation.column"
      name="Column:"
      placeholder="Enter a column"
    ></WidgetAutocomplete>
    <WidgetAutocomplete
      id="aggregationFunctionInput"
      v-model="aggregation.aggfunction"
      name="Function:"
      :options="aggregationFunctions"
      placeholder="Aggregation function"
    ></WidgetAutocomplete>
  </fieldset>
</template>
<script lang="ts">
import _ from 'lodash';
import { Component, Prop, Vue, Watch } from 'vue-property-decorator';
import { Getter } from 'vuex-class';
import { AggFunctionStep } from '@/lib/steps';
import WidgetAutocomplete from './WidgetAutocomplete.vue';

@Component({
  name: 'widget-aggregation',
  components: {
    WidgetAutocomplete,
  },
})
export default class WidgetAggregation extends Vue {
  @Prop({ type: Object, default: () => ({ column: '', aggfunction: 'sum', newcolumn: '' }) })
  value!: AggFunctionStep;

  @Getter columnNames!: string[];

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
@import '../../styles/_variables';
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
