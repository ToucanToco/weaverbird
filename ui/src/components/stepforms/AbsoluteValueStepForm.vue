<template>
  <div>
    <StepFormHeader
      :title="title"
      :stepName="editedStep.name"
      :version="version"
      :backendError="backendError"
    />
    <ColumnPicker
      class="columnInput"
      v-model="editedStep.column"
      name="Value column:"
      placeholder="Select a column"
      data-path=".column"
      :errors="errors"
    />
    <InputTextWidget
      class="newColumnInput"
      v-model="editedStep.new_column"
      name="New column:"
      placeholder="Enter a new column name"
      data-path=".new_column"
      :errors="errors"
      :warning="duplicateColumnName"
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
import type { AbsoluteValueStep, PipelineStepName } from '@/lib/steps';
import type { VariableDelimiters, VariablesBucket } from '@/lib/variables';
import { VQBModule } from '@/store';

import ColumnPicker from './ColumnPicker.vue';
import BaseStepForm from './StepForm.vue';

@Component({
  name: 'absolutevalue-step-form',
  components: {
    InputTextWidget,
    ColumnPicker,
  },
})
export default class AbsoluteValueStepForm extends BaseStepForm<AbsoluteValueStep> {
  stepname: PipelineStepName = 'absolutevalue';

  @VQBModule.State availableVariables?: VariablesBucket;

  @VQBModule.State variableDelimiters?: VariableDelimiters;

  @Prop({ type: Object, default: () => ({ name: 'absolutevalue', column: '', new_column: '' }) })
  declare initialStepValue: AbsoluteValueStep;

  readonly title: string = 'Absolute Value';

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
