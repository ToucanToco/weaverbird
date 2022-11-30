<template>
  <div>
    <StepFormHeader
      :title="title"
      :stepName="editedStep.name"
      :version="version"
      :backendError="backendError"
    />
    <InputTextWidget
      class="newColumnInput"
      v-model="editedStep.newColumn"
      name="New column:"
      placeholder="Enter a new column name"
      data-path=".newColumn"
      :errors="errors"
      :warning="duplicateColumnName"
      :available-variables="availableVariables"
      :variable-delimiters="variableDelimiters"
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
    />
    <StepFormButtonbar />
  </div>
</template>

<script lang="ts">
import Component from 'vue-class-component';
import { Prop } from 'vue-property-decorator';

import InputTextWidget from '@/components/stepforms/widgets/InputText.vue';
import type { AddTextColumnStep, PipelineStepName } from '@/lib/steps';
import type { VariableDelimiters, VariablesBucket } from '@/lib/variables';
import { VQBModule } from '@/store';

import BaseStepForm from './StepForm.vue';

@Component({
  name: 'text-step-form',
  components: {
    InputTextWidget,
  },
})
export default class AddTextColumnStepForm extends BaseStepForm<AddTextColumnStep> {
  stepname: PipelineStepName = 'text';

  @VQBModule.State availableVariables?: VariablesBucket;

  @VQBModule.State variableDelimiters?: VariableDelimiters;

  @Prop({ type: Object, default: () => ({ name: 'text', newColumn: '', text: '' }) })
  declare initialStepValue: AddTextColumnStep;

  readonly title: string = 'Add Text Column';

  get duplicateColumnName() {
    if (this.columnNames.includes(this.editedStep.newColumn)) {
      return `A column name "${this.editedStep.newColumn}" already exists. You will overwrite it.`;
    } else {
      return null;
    }
  }

  submit() {
    this.$$super.submit();
    if (this.errors === null) {
      this.setSelectedColumns({ column: this.editedStep.newColumn });
    }
  }
}
</script>
