<template>
  <fieldset class="widget-aggregation__container">
    <WidgetAutocomplete
      id="columnInput"
      :options="columnNames"
      v-model="aggregation.column"
      name="Column"
      placeholder="Enter the old column name"
    ></WidgetAutocomplete>
    <WidgetAutocomplete
      id="aggregationFunctionInput"
      v-model="aggregation.aggfunction"
      name="Aggregation function"
      :options="aggregationFunctions"
      placeholder="Choose your aggregation function"
    ></WidgetAutocomplete>
    <WidgetInputText
      id="newcolumnInput"
      v-model="aggregation.newcolumn"
      name="New Column"
      placeholder="Enter a newcolumn name"
    ></WidgetInputText>
  </fieldset>
</template>
<script lang="ts">
import _ from 'lodash';
import { Component, Prop, Vue, Watch } from 'vue-property-decorator';
import { Getter } from 'vuex-class';
import { AggFunctionStep } from '@/lib/steps';
import WidgetInputText from './WidgetInputText.vue';
import WidgetAutocomplete from './WidgetAutocomplete.vue';

const defaultValues: AggFunctionStep = {
  column: '',
  aggfunction: 'sum',
  newcolumn: '',
};

@Component({
  name: 'widget-aggregation',
  components: {
    WidgetInputText,
    WidgetAutocomplete,
  },
})
export default class WidgetAggregation extends Vue {
  @Prop({
    type: Object,
  })
  value!: AggFunctionStep;

  @Getter columnNames!: string[];

  aggregation: AggFunctionStep = { ...this.value };
  aggregationFunctions: AggFunctionStep['aggfunction'][] = ['sum', 'avg', 'count', 'min', 'max'];

  created() {
    if (_.isEmpty(this.value)) {
      this.value = { ...defaultValues };
    }
  }

  @Watch('aggregation', { immediate: true, deep: true })
  onAggregationChanged(newval: object, oldval: object) {
    if (!_.isEqual(newval, oldval)) {
      this.$emit('input', this.aggregation);
    }
  }
}
</script>
<style lang="scss" scoped>
@import '../styles/_variables';

.widget-aggregation__container {
  @extend %form-widget__container;
  margin-bottom: 0;
}
</style>
