<template>
  <div>
    <StepFormHeader
      :title="title"
      :stepName="editedStep.name"
      :version="version"
      :backendError="backendError"
    />
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
      unstyled-items
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
import Component from 'vue-class-component';
import { Prop } from 'vue-property-decorator';

import TotalDimensionsWidget from '@/components/stepforms/widgets/TotalDimensions.vue';
import { setAggregationsNewColumnsInStep } from '@/lib/helpers';
import { AddTotalRowsStep, Aggregation, PipelineStepName, TotalDimension } from '@/lib/steps';

import BaseStepForm from './StepForm.vue';
import AggregationWidget from './widgets/Aggregation.vue';
import ListWidget from './widgets/List.vue';
import MultiselectWidget from './widgets/Multiselect.vue';

@Component({
  name: 'totals-step-form',
  components: {
    ListWidget,
    MultiselectWidget,
  },
})
export default class AddTotalRowsStepForm extends BaseStepForm<AddTotalRowsStep> {
  stepname: PipelineStepName = 'totals';

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
    setAggregationsNewColumnsInStep(this.editedStep);
    this.$$super.submit();
  }
}
</script>
