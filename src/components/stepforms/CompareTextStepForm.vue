<template>
  <div>
    <StepFormHeader :title="title" :stepName="editedStep.name" :version="version" />
    <InputTextWidget
      class="newColumnNameInput"
      v-model="editedStep.newColumnName"
      name="New column name (for the comparison result):"
      placeholder="Enter a column name"
      data-path=".new_column_name"
      :errors="errors"
      :warning="duplicateColumnName"
    />
    <ColumnPicker
      class="strCol1Input"
      v-model="editedStep.strCol1"
      name="First text column to compare:"
      placeholder="Select a column"
      data-path=".strCol1"
      :syncWithSelectedColumn="false"
      :errors="errors"
      :available-variables="availableVariables"
      :variable-delimiters="variableDelimiters"
    />
    <ColumnPicker
      class="strCol2Input"
      v-model="editedStep.strCol2"
      name="Second text column to compare:"
      placeholder="Select a column"
      data-path=".strCol2"
      :syncWithSelectedColumn="false"
      :errors="errors"
      :available-variables="availableVariables"
      :variable-delimiters="variableDelimiters"
    />
    <StepFormButtonbar />
  </div>
</template>

<script lang="ts">
import Component from 'vue-class-component';
import { Prop } from 'vue-property-decorator';

import ColumnPicker from '@/components/stepforms/ColumnPicker.vue';
import InputTextWidget from '@/components/stepforms/widgets/InputText.vue';
import { CompareTextStep, PipelineStepName } from '@/lib/steps';
import { VariableDelimiters, VariablesBucket } from '@/lib/variables';
import { VQBModule } from '@/store';

import BaseStepForm from './StepForm.vue';

@Component({
  name: 'compare-text-step-form',
  components: {
    ColumnPicker,
    InputTextWidget,
  },
})
export default class CompareTextStepForm extends BaseStepForm<CompareTextStep> {
  stepname: PipelineStepName = 'strcmp';

  @VQBModule.State availableVariables?: VariablesBucket;

  @VQBModule.State variableDelimiters?: VariableDelimiters;

  @Prop({
    type: Object,
    default: () => ({
      name: 'strcmp',
      strCol1: '',
      strCol2: '',
    }),
  })
  initialStepValue!: CompareTextStep;

  readonly title: string = 'Compare Text Columns';

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
