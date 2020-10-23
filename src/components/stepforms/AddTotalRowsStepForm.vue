<template>
  <div>
    <StepFormHeader :title="title" :stepName="editedStep.name" :version="version" />
    <ListWidget
      addFieldName="Add new column"
      class="totals"
      name="Columns to compute total rows in:"
      v-model="totalDimensions"
      :defaultItem="defaultTotalDimensions"
      :widget="totalDimensionsWidget"
      :automatic-new-field="false"
      data-path=".totalDimensions"
      :errors="errors"
    />
    <ListWidget
      class="aggregationsInput"
      addFieldName="Add aggregation"
      name="Columns to aggregate:"
      v-model="aggregations"
      :defaultItem="defaultAggregation"
      :widget="widgetAggregation"
      :automatic-new-field="false"
      data-path=".aggregations"
      :errors="errors"
    />
    <MultiselectWidget
      class="groupsInput"
      v-model="editedStep.groups"
      name="(Optional) Group by:"
      :options="columnNames"
      @input="setSelectedColumns({ column: editedStep.groups[editedStep.groups.length - 1] })"
      placeholder="Add columns"
      data-path=".groups"
      :errors="errors"
    />
    <StepFormButtonbar />
  </div>
</template>

<script lang="ts">
import { Prop } from 'vue-property-decorator';

import { StepFormComponent } from '@/components/formlib';
import TotalDimensionsWidget from '@/components/stepforms/widgets/TotalDimensions.vue';
import { AddTotalRowsStep, Aggregation, TotalDimension } from '@/lib/steps';

import BaseStepForm from './StepForm.vue';
import AggregationWidget from './widgets/Aggregation.vue';
import ListWidget from './widgets/List.vue';
import MultiselectWidget from './widgets/Multiselect.vue';

@StepFormComponent({
  vqbstep: 'totals',
  name: 'totals-step-form',
  components: {
    ListWidget,
    MultiselectWidget,
  },
})
export default class AddTotalRowsStepForm extends BaseStepForm<AddTotalRowsStep> {
  @Prop({
    type: Object,
    default: () => ({ name: 'totals', totalDimensions: [], aggregations: [] }),
  })
  initialStepValue!: AddTotalRowsStep;

  readonly title: string = 'Add Total Rows';
  totalDimensionsWidget = TotalDimensionsWidget;
  widgetAggregation = AggregationWidget;

  get defaultAggregation() {
    const agg: Aggregation = {
      columns: [],
      newcolumns: [],
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

  get defaultTotalDimensions() {
    return { totalColumn: '', totalRowsLabel: '' } as TotalDimension;
  }

  get totalDimensions() {
    if (this.editedStep.totalDimensions.length) {
      return this.editedStep.totalDimensions;
    } else {
      return [{ totalColumn: '', totalRowsLabel: '' }];
    }
  }

  set totalDimensions(newval) {
    this.editedStep.totalDimensions = [...newval];
  }

  submit() {
    /**
     * If different aggregations have to be performed on the same column, add a suffix
     * to the automatically generated newcolumn name
     */
    const newcolumnOccurences: { [prop: string]: number } = {};
    for (const agg of this.editedStep.aggregations) {
      agg.newcolumns = [...agg.columns];
      for (const c of agg.newcolumns) {
        newcolumnOccurences[c] = (newcolumnOccurences[c] || 0) + 1;
      }
    }
    for (const agg of this.editedStep.aggregations) {
      for (let i = 0; i < agg.newcolumns.length; i++) {
        if (newcolumnOccurences[agg.newcolumns[i]] > 1) {
          agg.newcolumns.splice(i, 1, `${agg.newcolumns[i]}-${agg.aggfunction}`);
        }
      }
    }
    this.$$super.submit();
  }
}
</script>
