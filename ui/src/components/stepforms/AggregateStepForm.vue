<template>
  <div>
    <StepFormHeader
      :title="title"
      :stepName="editedStep.name"
      :version="version"
      :backendError="backendError"
    />
    <MultiselectWidget
      class="groupbyColumnsInput"
      v-model="editedStep.on"
      name="Group rows by..."
      :options="columnNames"
      @input="setSelectedColumns({ column: editedStep.on[editedStep.on.length - 1] })"
      placeholder="Add columns"
      data-path=".on"
      :errors="errors"
      :available-variables="availableVariables"
      :variable-delimiters="variableDelimiters"
    />
    <ListWidget
      addFieldName="Add aggregation"
      class="toremove"
      name="And aggregate..."
      v-model="aggregations"
      :defaultItem="defaultAggregation"
      :widget="widgetAggregation"
      :automatic-new-field="false"
      data-path=".aggregations"
      :errors="errors"
      :available-variables="availableVariables"
      :variable-delimiters="variableDelimiters"
    />
    <CheckboxWidget
      class="keepOriginalGranularityCheckbox"
      label="Keep original granularity and add aggregation(s) in new column(s)"
      v-model="editedStep.keepOriginalGranularity"
    />
    <StepFormButtonbar />
  </div>
</template>

<script lang="ts">
import Component from 'vue-class-component';
import { Prop } from 'vue-property-decorator';

import CheckboxWidget from '@/components/stepforms/widgets/Checkbox.vue';
import type { AggregateStep, Aggregation, PipelineStepName } from '@/lib/steps';
import type { VariableDelimiters, VariablesBucket } from '@/lib/variables';
import { VQBModule } from '@/store';

import BaseStepForm from './StepForm.vue';
import { suffixAggregationsColumns } from './utils';
import AggregationWidget from './widgets/Aggregation.vue';
import ListWidget from './widgets/List.vue';
import MultiselectWidget from './widgets/Multiselect.vue';

@Component({
  name: 'aggregate-step-form',
  components: {
    CheckboxWidget,
    ListWidget,
    MultiselectWidget,
  },
})
export default class AggregateStepForm extends BaseStepForm<AggregateStep> {
  stepname: PipelineStepName = 'aggregate';

  @VQBModule.State availableVariables?: VariablesBucket;

  @VQBModule.State variableDelimiters?: VariableDelimiters;

  @Prop({
    type: Object,
    default: () => ({
      name: 'aggregate',
      on: [],
      aggregations: [],
      keepOriginalGranularity: false,
    }),
  })
  declare initialStepValue: AggregateStep;

  readonly title: string = 'Aggregate';
  widgetAggregation = AggregationWidget;

  /** Overload the definition of editedStep in BaseStepForm, to manage retrocompatibility:
   *
   *  - the keepOriginalGranularity parameter which may be undefined and has to be treated
   *    specifically to guarantee retrocompatibility (as this parameter did not exist
   *    when this step was first created)
   *  - column and newcolumn (simple strings parameters) are deprecated and replaced by
   *    columns and newcolumns (list if strings)
   */
  editedStep: AggregateStep = {
    ...this.initialStepValue,
    ...this.stepFormDefaults,
    aggregations: this.initialStepValue.aggregations.map(x => ({
      ...x,
      columns: x.column ? [x.column] : x.columns,
      newcolumns: x.newcolumn ? [x.newcolumn] : x.newcolumns,
      column: undefined,
      newcolumn: undefined,
    })),
    keepOriginalGranularity: this.initialStepValue.keepOriginalGranularity ?? false,
  };

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

  submit() {
    suffixAggregationsColumns(this.editedStep);
    this.$$super.submit();
  }
}
</script>
