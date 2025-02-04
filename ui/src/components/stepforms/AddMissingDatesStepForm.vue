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
      :available-variables="availableVariables"
      :variable-delimiters="variableDelimiters"
      :trusted-variable-delimiters="trustedVariableDelimiters"
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
import { defineComponent, PropType } from 'vue';

import ColumnPicker from '@/components/stepforms/ColumnPicker.vue';
import AutocompleteWidget from '@/components/stepforms/widgets/Autocomplete.vue';
import MultiselectWidget from '@/components/stepforms/widgets/Multiselect.vue';
import type { AddMissingDatesStep, PipelineStepName } from '@/lib/steps';

import BaseStepForm from './StepForm.vue';

type DateGranularity = 'day' | 'month' | 'year';

export default defineComponent({
  name: 'add-missing-dates-step-form',

  components: {
    ColumnPicker,
    AutocompleteWidget,
    MultiselectWidget,
  },

  extends: BaseStepForm,

  props: {
    initialStepValue: {
      type: Object as PropType<AddMissingDatesStep>,
      default: (): AddMissingDatesStep => ({
        name: 'addmissingdates',
        datesColumn: '',
        datesGranularity: 'day',
      }),
    },
  },

  data(): {
    stepname: PipelineStepName;
    title: string;
    datesGranularities: DateGranularity[];
    editedStep: AddMissingDatesStep;
  } {
    return {
      stepname: 'addmissingdates',
      title: 'Add Missing Dates',
      datesGranularities: ['day', 'month', 'year'],
      editedStep: {
        ...this.initialStepValue,
        ...this.stepFormDefaults,
      },
    };
  },
});
</script>
