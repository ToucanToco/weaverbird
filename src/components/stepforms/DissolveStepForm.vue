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
      label="Keep original granularity and add aggregation(s) in new column(s)"
      v-model="editedStep.include_nulls"
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
import DissolveAggregationWidget from './widgets/DissolveAggregation.vue';
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
export default class RankStepForm extends BaseStepForm<DissolveStep> {
  stepname: PipelineStepName = 'dissolve';

  @VQBModule.State availableVariables?: VariablesBucket;

  @VQBModule.State variableDelimiters?: VariableDelimiters;

  @Prop({
    type: Object,
    default: () => ({ name: 'dissolve', groups: [], include_nulls: false, aggregations: [] }),
  })
  initialStepValue!: DissolveStep;

  readonly title: string = 'Dissolve';
  widgetAggregation = DissolveAggregationWidget;

  get defaultAggregation() {
    return { column: '', agg_function: '' };
  }
}
</script>
