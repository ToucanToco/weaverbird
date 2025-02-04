<template>
  <div>
    <StepFormHeader
      :title="title"
      :stepName="editedStep.name"
      :version="version"
      :backendError="backendError"
    />
    <InputTextWidget
      class="newColumnNameInput"
      v-model="editedStep.newColumnName"
      name="New colum name:"
      placeholder="Enter a new column name"
      data-path=".newColumnName"
      :errors="errors"
      :warning="duplicateColumnName"
    />
    <ColumnPicker
      class="startDateColumnInput"
      v-model="editedStep.startDateColumn"
      name="Start date column:"
      placeholder="Select a column"
      data-path=".startDateColumn"
      :syncWithSelectedColumn="false"
      :errors="errors"
      :available-variables="availableVariables"
      :variable-delimiters="variableDelimiters"
      :trusted-variable-delimiters="trustedVariableDelimiters"
      :columnNames="columnNames"
      :selectedColumns="selectedColumns"
      @setSelectedColumns="setSelectedColumns"
    />
    <ColumnPicker
      class="endDateColumnInput"
      v-model="editedStep.endDateColumn"
      name="End date column:"
      placeholder="Select a column"
      data-path=".endDateColumn"
      :syncWithSelectedColumn="false"
      :errors="errors"
      :available-variables="availableVariables"
      :variable-delimiters="variableDelimiters"
      :trusted-variable-delimiters="trustedVariableDelimiters"
      :columnNames="columnNames"
      :selectedColumns="selectedColumns"
      @setSelectedColumns="setSelectedColumns"
    />
    <AutocompleteWidget
      class="durationInInput"
      name="Compute duration in:"
      v-model="editedStep.durationIn"
      :options="durationUnits"
      data-path=".durationIn"
      :errors="errors"
    />
    <StepFormButtonbar />
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';

import ColumnPicker from '@/components/stepforms/ColumnPicker.vue';
import AutocompleteWidget from '@/components/stepforms/widgets/Autocomplete.vue';
import InputTextWidget from '@/components/stepforms/widgets/InputText.vue';
import type { ComputeDurationStep, PipelineStepName } from '@/lib/steps';
import BaseStepForm from './StepForm.vue';

type DurationUnit = 'days' | 'hours' | 'minutes' | 'seconds';

export default defineComponent({
  name: 'duration-step-form',
  components: {
    AutocompleteWidget,
    ColumnPicker,
    InputTextWidget,
  },
  extends: BaseStepForm,
  props: {
    initialStepValue: {
      type: Object as PropType<Partial<ComputeDurationStep>>,
      default: (): Partial<ComputeDurationStep> => ({
        name: 'duration',
        newColumnName: '',
        startDateColumn: '',
        endDateColumn: '',
        durationIn: 'days',
      }),
    },
  },
  data() {
    return {
      stepname: 'duration' as PipelineStepName,
      title: 'Compute Duration' as string,
      durationUnits: ['days', 'hours', 'minutes', 'seconds'] as DurationUnit[],
    };
  },
  computed: {
    duplicateColumnName() {
      if (this.columnNames.includes(this.editedStep.newColumnName)) {
        return `A column name "${this.editedStep.newColumnName}" already exists. You will overwrite it.`;
      } else {
        return null;
      }
    },
  },
  methods: {
    submit() {
      this.$$super.submit();
      if (this.errors === null) {
        this.setSelectedColumns({ column: this.editedStep.newColumnName });
      }
    },
  },
});
</script>
