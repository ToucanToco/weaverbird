<template>
  <div>
    <step-form-title :title="title"></step-form-title>
    <WidgetMultiselect
      id="groupbyColumnsInput"
      v-model="editedStep.on"
      name="Group by:"
      :options="columnNames"
      @input="setSelectedColumns({ column: editedStep.on[0] })"
      placeholder="Add columns"
    ></WidgetMultiselect>
    <WidgetList
      addFieldName="Add aggregation"
      id="toremove"
      name="Aggregations:"
      v-model="aggregations"
      :defaultItem="defaultAggregation"
      :widget="'widget-aggregation'"
      :automatic-new-field="false"
    ></WidgetList>
    <step-form-buttonbar :errors="errors" :cancel="cancelEdition" :submit="submit"></step-form-buttonbar>
  </div>
</template>

<script lang="ts">
import _ from 'lodash';
import { Prop } from 'vue-property-decorator';
import { AggFunctionStep, AggregationStep } from '@/lib/steps';
import aggregateSchema from '@/assets/schemas/aggregate-step__schema.json';
import WidgetMultiselect from './WidgetMultiselect.vue';
import WidgetList from './WidgetList.vue';
import BaseStepForm from './StepForm.vue';
import { StepFormComponent } from '@/components/formlib';

@StepFormComponent({
  vqbstep: 'aggregate',
  name: 'aggregate-step-form',
  components: {
    WidgetList,
    WidgetMultiselect,
  },
})
export default class AggregateStepForm extends BaseStepForm<AggregationStep> {
  @Prop({ type: Object, default: () => ({ name: 'aggregate', on: [], aggregations: [] }) })
  initialStepValue!: AggregationStep;

  readonly title: string = 'Edit Aggregate Step';

  editedStepModel = aggregateSchema;

  get defaultAggregation() {
    const agg: AggFunctionStep = {
      column: '',
      newcolumn: '',
      aggfunction: 'sum',
    };
    return agg;
  }

  get aggregations() {
    if (this.editedStep.aggregations.length) {
      return this.editedStep.aggregations;
    } else {
      return [this.defaultAggregation];
    }
  }

  set aggregations(newval) {
    this.editedStep.aggregations = [...newval];
  }

  get stepSelectedColumn() {
    return this.editedStep.on[0];
  }

  set stepSelectedColumn(colname: string | null) {
    if (colname === null) {
      throw new Error('should not try to set null on filter "column" field');
    }
    if (!_.isNil(colname) && !this.editedStep.on.includes(colname)) {
      this.editedStep.on.push(colname);
    }
  }

  submit() {
    /**
     * If different aggregations have to be performed on the same column, add a suffix
     * to the automatically generated newcolumn name
     */
    const newcolumnOccurences: { [prop: string]: number } = {};
    for (const agg of this.editedStep.aggregations) {
      agg.newcolumn = agg.column;
      newcolumnOccurences[agg.newcolumn] = (newcolumnOccurences[agg.newcolumn] || 0) + 1;
    }
    for (const agg of this.editedStep.aggregations) {
      if (newcolumnOccurences[agg.newcolumn] > 1) {
        agg.newcolumn = `${agg.newcolumn}-${agg.aggfunction}`;
      }
    }
    this.$$super.submit();
  }
}
</script>
<style lang="scss" scoped>
@import '../../styles/_variables';
.widget-form-action__button {
  @extend %button-default;
}

.widget-form-action__button--validate {
  background-color: $active-color;
}

.step-edit-form {
  border-bottom: 1px solid $grey;
  display: flex;
  justify-content: flex-start;
  align-items: center;
  padding-bottom: 20px;
  margin: 10px 0 15px;
  width: 100%;
}

.step-edit-form__title {
  color: $base-color;
  font-weight: 600;
  font-size: 14px;
  margin: 0;
}
</style>
