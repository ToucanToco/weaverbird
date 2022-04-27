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
    <AutocompleteWidget
      class="orderInput"
      name="Aggregation method:"
      v-model="editedStep.agg_function"
      :options="[
        'sum',
        'avg',
        'count',
        'count distinct',
        'count distinct with null values',
        'min',
        'max',
        'first',
        'last',
      ]"
      data-path=".agg_function"
    />
    <StepFormButtonbar />
  </div>
</template>
<script lang="ts">
import Component from 'vue-class-component';
import { Prop } from 'vue-property-decorator';

import AutocompleteWidget from '@/components/stepforms/widgets/Autocomplete.vue';
import { PipelineStepName, DissolveStep } from '@/lib/steps';
import { VariableDelimiters, VariablesBucket } from '@/lib/variables';
import { VQBModule } from '@/store';

import BaseStepForm from './StepForm.vue';
import MultiselectWidget from './widgets/Multiselect.vue';

@Component({
  name: 'dissolve-step-form',
  components: {
    AutocompleteWidget,
    MultiselectWidget,
  },
})
export default class RankStepForm extends BaseStepForm<DissolveStep> {
  stepname: PipelineStepName = 'dissolve';

  @VQBModule.State availableVariables?: VariablesBucket;

  @VQBModule.State variableDelimiters?: VariableDelimiters;

  @Prop({
    type: Object,
    default: () => ({ name: 'dissolve', groups: [], agg_function: 'sum' }),
  })
  initialStepValue!: DissolveStep;

  readonly title: string = 'Dissolve';
}
</script>
