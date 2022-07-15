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
      v-model="editedStep.groups"
      name="Group rows by..."
      :options="columnNames"
      placeholder="Add columns"
      data-path=".groups"
      :errors="errors"
      :available-variables="availableVariables"
      :variable-delimiters="variableDelimiters"
    />
    <ListWidget
      v-model="editedStep.aggregations"
      addFieldName="Add aggregation"
      class="toremove"
      name="And aggregate..."
      :defaultItem="defaultAggregation"
      :widget="widgetAggregation"
      :automatic-new-field="false"
      data-path=".aggregations"
      :errors="errors"
      :available-variables="availableVariables"
      :variable-delimiters="variableDelimiters"
    />
    <CheckboxWidget
      class="keepNullsCheckbox"
      label="Include null values in results"
      v-model="editedStep.includeNulls"
    />
    <StepFormButtonbar />
  </div>
</template>
<script lang="ts">
import Component from 'vue-class-component';
import { Prop } from 'vue-property-decorator';

import CheckboxWidget from '@/components/stepforms/widgets/Checkbox.vue';
import { DissolveStep, PipelineStepName } from '@/lib/steps';
import { VariableDelimiters, VariablesBucket } from '@/lib/variables';
import { VQBModule } from '@/store';

import BaseStepForm from './StepForm.vue';
import AggregationWidget from './widgets/Aggregation.vue';
import ListWidget from './widgets/List.vue';
import MultiselectWidget from './widgets/Multiselect.vue';

@Component({
  name: 'dissolve-step-form',
  components: {
    CheckboxWidget,
    ListWidget,
    MultiselectWidget,
  },
})
export default class DissolveStepForm extends BaseStepForm<DissolveStep> {
  stepname: PipelineStepName = 'dissolve';

  @VQBModule.State availableVariables?: VariablesBucket;

  @VQBModule.State variableDelimiters?: VariableDelimiters;

  @Prop({
    type: Object,
    default: () => ({ name: 'dissolve', groups: [], includeNulls: false, aggregations: [] }),
  })
  initialStepValue!: DissolveStep;

  readonly title: string = 'Dissolve';
  widgetAggregation = AggregationWidget;

  get defaultAggregation() {
    const agg: Aggregation = {
      columns: [],
      newcolumns: [],
      aggfunction: 'sum',
    };
    return agg;
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
        /**
         * If we keep the original granularity, we keep the original value columns
         * and add the aggregation results in new columns, so we need to suffix those
         */
        if (newcolumnOccurences[agg.newcolumns[i]] > 1) {
          agg.newcolumns.splice(i, 1, `${agg.newcolumns[i]}-${agg.aggfunction}`);
        }
        if (this.editedStep.groups.includes(agg.newcolumns[i])) {
          agg.newcolumns.splice(i, 1, `${agg.newcolumns[i]}-${agg.aggfunction}`);
        }
      }
    }
    this.$$super.submit();
  }
}
</script>
