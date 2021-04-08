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
import Component from 'vue-class-component';
import { Prop } from 'vue-property-decorator';

import ColumnPicker from '@/components/stepforms/ColumnPicker.vue';
import AutocompleteWidget from '@/components/stepforms/widgets/Autocomplete.vue';
import InputTextWidget from '@/components/stepforms/widgets/InputText.vue';
import { ComputeDurationStep, PipelineStepName } from '@/lib/steps';
import { VariableDelimiters, VariablesBucket } from '@/lib/variables';
import { VQBModule } from '@/store';

import BaseStepForm from './StepForm.vue';

type DurationUnit = 'days' | 'hours' | 'minutes' | 'seconds';

@Component({
  vqbstep: 'duration',
  name: 'duration-step-form',
  components: {
    AutocompleteWidget,
    ColumnPicker,
    InputTextWidget,
  },
})
export default class ComputeDurationStepForm extends BaseStepForm<ComputeDurationStep> {
  stepname: PipelineStepName = 'duration';

  @VQBModule.State availableVariables?: VariablesBucket;

  @VQBModule.State variableDelimiters?: VariableDelimiters;

  @Prop({
    type: Object,
    default: () => ({
      name: 'duration',
      newColumnName: '',
      startDateColumn: '',
      endDateColumn: '',
      durationIn: 'days',
    }),
  })
  initialStepValue!: ComputeDurationStep;

  readonly title: string = 'Compute Duration';
  readonly durationUnits: DurationUnit[] = ['days', 'hours', 'minutes', 'seconds'];

  get duplicateColumnName() {
    if (this.columnNames.includes(this.editedStep.newColumnName)) {
      return `A column name "${this.editedStep.newColumnName}" already exists. You will overwrite it.`;
    } else {
      return null;
    }
  }

  submit() {
    this.$$super.submit();
    if (this.errors === null) {
      this.setSelectedColumns({ column: this.editedStep.newColumnName });
    }
  }
}
</script>
