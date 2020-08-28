<template>
  <div>
    <StepFormHeader :title="title" :stepName="this.editedStep.name" />
    <InputTextWidget
      class="newColumnInput"
      v-model="editedStep.new_column"
      name="New colum:"
      placeholder="Enter a new column name"
      data-path=".new_column"
      :errors="errors"
      :warning="duplicateColumnName"
      :available-variables="availableVariables"
      :variable-delimiters="variableDelimiters"
      :advanced-variable-delimiters="advancedVariableDelimiters"
      :use-advanced-variable="true"
    />
    <InputTextWidget
      class="textInput"
      v-model="editedStep.text"
      name="Enter a text:"
      placeholder
      data-path=".text"
      :errors="errors"
      :available-variables="availableVariables"
      :variable-delimiters="variableDelimiters"
      :advanced-variable-delimiters="advancedVariableDelimiters"
      :use-advanced-variable="true"
    />
    <StepFormButtonbar />
  </div>
</template>

<script lang="ts">
import { Prop } from 'vue-property-decorator';

import { StepFormComponent } from '@/components/formlib';
import InputTextWidget from '@/components/stepforms/widgets/InputText.vue';
import { AddTextColumnStep } from '@/lib/steps';
import { VariableDelimiters, VariablesBucket } from '@/lib/variables';
import { VQBModule } from '@/store';

import BaseStepForm from './StepForm.vue';

@StepFormComponent({
  vqbstep: 'text',
  name: 'text-step-form',
  components: {
    InputTextWidget,
  },
})
export default class AddTextColumnStepForm extends BaseStepForm<AddTextColumnStep> {
  @VQBModule.State availableVariables!: VariablesBucket;

  @VQBModule.State variableDelimiters!: VariableDelimiters;

  @VQBModule.State advancedVariableDelimiters!: VariableDelimiters;

  @Prop({ type: Object, default: () => ({ name: 'text', new_column: '', text: '' }) })
  initialStepValue!: AddTextColumnStep;

  readonly title: string = 'Add Text Column';

  get duplicateColumnName() {
    if (this.columnNames.includes(this.editedStep.new_column)) {
      return `A column name "${this.editedStep.new_column}" already exists. You will overwrite it.`;
    } else {
      return null;
    }
  }

  submit() {
    this.$$super.submit();
    if (this.errors === null) {
      this.setSelectedColumns({ column: this.editedStep.new_column });
    }
  }
}
</script>
