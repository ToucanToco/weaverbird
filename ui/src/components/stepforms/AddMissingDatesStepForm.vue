<template>
  <div>
    <StepFormHeader
      :title="title"
      :stepName="editedStep.name"
      :version="version"
      :backendError="backendError"
    />
    <ColumnPicker
      class="datesColumnInput"
      v-model="editedStep.datesColumn"
      name="Dates column:"
      placeholder="Select a column"
      data-path=".datesColumn"
      :errors="errors"
      :columnNames="columnNames"
      :selectedColumns="selectedColumns"
      @setSelectedColumns="setSelectedColumns"
    />
    <AutocompleteWidget
      class="datesGranularityInput"
      name="Dates granularity:"
      v-model="editedStep.datesGranularity"
      :options="datesGranularities"
      data-path=".datesGranularity"
      :errors="errors"
    />
    <MultiselectWidget
      class="groupsInput"
      v-model="editedStep.groups"
      name="(Optional) Group by:"
      :options="columnNames"
      placeholder="Select columns"
      data-path=".groups"
      :errors="errors"
      :available-variables="availableVariables"
      :variable-delimiters="variableDelimiters"
      :trusted-variable-delimiters="trustedVariableDelimiters"
      :allowCustom="true"
    />
    <StepFormButtonbar />
  </div>
</template>
<script lang="ts">
import Component from 'vue-class-component';
import { Prop } from 'vue-property-decorator';

import ColumnPicker from '@/components/stepforms/ColumnPicker.vue';
import AutocompleteWidget from '@/components/stepforms/widgets/Autocomplete.vue';
import MultiselectWidget from '@/components/stepforms/widgets/Multiselect.vue';
import type { AddMissingDatesStep, PipelineStepName } from '@/lib/steps';

import BaseStepForm from './StepForm.vue';

type DateGranularity = 'day' | 'month' | 'year';

@Component({
  name: 'add-missing-dates-step-form',
  components: {
    ColumnPicker,
    AutocompleteWidget,
    MultiselectWidget,
  },
})
export default class AddMissingDatesStepForm extends BaseStepForm<AddMissingDatesStep> {
  stepname: PipelineStepName = 'addmissingdates';

  @Prop({
    type: Object,
    default: () => ({
      name: 'addmissingdates',
      datesColumn: '',
      datesGranularity: 'day',
    }),
  })
  declare initialStepValue: AddMissingDatesStep;

  readonly title: string = 'Add Missing Dates';
  readonly datesGranularities: DateGranularity[] = ['day', 'month', 'year'];
}
</script>
