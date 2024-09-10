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
      :columnNames="columnNames"
      :selectedColumns="selectedColumns"
      @setSelectedColumns="setSelectedColumns"
    />
    <InputTextWidget
      class="newColumnInput"
      v-model="editedStep.newColumn"
      name="New column:"
      placeholder="Enter a new column name"
      data-path=".newColumn"
      :errors="errors"
      :warning="duplicateColumnName"
    />
    <StepFormButtonbar />
  </div>
</template>

<script lang="ts">
import Component from 'vue-class-component';
import { Prop } from 'vue-property-decorator';

import InputTextWidget from '@/components/stepforms/widgets/InputText.vue';
import type { AbsoluteValueStep, PipelineStepName } from '@/lib/steps';

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

  @Prop({ type: Object, default: () => ({ name: 'absolutevalue', column: '', newColumn: '' }) })
  declare initialStepValue: AbsoluteValueStep;

  readonly title: string = 'Absolute Value';

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
