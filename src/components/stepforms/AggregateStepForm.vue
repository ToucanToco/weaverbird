<template>
  <div>
    <StepFormHeader :title="title" :stepName="editedStep.name" :version="version" />
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
import { Prop } from 'vue-property-decorator';

import { StepFormComponent } from '@/components/formlib';
import CheckboxWidget from '@/components/stepforms/widgets/Checkbox.vue';
import { AggFunctionStep, AggregationStep } from '@/lib/steps';
import { VariableDelimiters, VariablesBucket } from '@/lib/variables';
import { VQBModule } from '@/store';

import BaseStepForm from './StepForm.vue';
import AggregationWidget from './widgets/Aggregation.vue';
import ListWidget from './widgets/List.vue';
import MultiselectWidget from './widgets/Multiselect.vue';

@StepFormComponent({
  vqbstep: 'aggregate',
  name: 'aggregate-step-form',
  components: {
    CheckboxWidget,
    ListWidget,
    MultiselectWidget,
  },
})
export default class AggregateStepForm extends BaseStepForm<AggregationStep> {
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
  initialStepValue!: AggregationStep;

  readonly title: string = 'Aggregate';
  widgetAggregation = AggregationWidget;

  /** Overload the definition of editedStep in BaseStepForm, to manage the
   * keepOriginalGranularity parameter which may be undefined and has to be treated
   * specifically to guarantee retrocompatibility (as this parameter did not exist
   *  when this step was first created) */
  editedStep = {
    ...this.initialStepValue,
    ...this.stepFormDefaults,
    keepOriginalGranularity: this.initialStepValue.keepOriginalGranularity ?? false,
  };

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
      /**
       * If we keep the original granularity, we keep the original value columns
       * and add the aggregation results in new columns, so we need to suffix those
       */
      if (newcolumnOccurences[agg.newcolumn] > 1 || this.editedStep.keepOriginalGranularity) {
        agg.newcolumn = `${agg.newcolumn}-${agg.aggfunction}`;
      }
      if (this.editedStep.on.includes(agg.newcolumn)) {
        agg.newcolumn = `${agg.newcolumn}-${agg.aggfunction}`;
      }
    }
    this.$$super.submit();
  }
}
</script>
