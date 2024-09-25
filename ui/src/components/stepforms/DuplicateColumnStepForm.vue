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
      name="Duplicate column..."
      placeholder="Enter a column"
      data-path=".column"
      :errors="errors"
      :columnNames="columnNames"
      :selectedColumns="selectedColumns"
      @setSelectedColumns="setSelectedColumns"
    />
    <InputTextWidget
      class="newColumnNameInput"
      v-model="editedStep.newColumnName"
      name="New column name:"
      placeholder="Enter a column name"
      data-path=".newColumnName"
      :errors="errors"
    />
    <StepFormButtonbar />
  </div>
</template>

<script lang="ts">
import Component from 'vue-class-component';
import { Prop } from 'vue-property-decorator';

import ColumnPicker from '@/components/stepforms/ColumnPicker.vue';
import InputTextWidget from '@/components/stepforms/widgets/InputText.vue';
import type { DuplicateColumnStep, PipelineStepName } from '@/lib/steps';

import BaseStepForm from './StepForm.vue';

@Component({
  name: 'duplicate-step-form',
  components: {
    ColumnPicker,
    InputTextWidget,
  },
})
export default class DuplicateColumnForm extends BaseStepForm<DuplicateColumnStep> {
  stepname: PipelineStepName = 'duplicate';

  @Prop({ type: Object, default: () => ({ name: 'duplicate', column: '', newColumnName: '' }) })
  declare initialStepValue: DuplicateColumnStep;

  readonly title: string = 'Duplicate column';

  get stepSelectedColumn() {
    return this.editedStep.column;
  }

  set stepSelectedColumn(colname: string | null) {
    if (colname === null) {
      throw new Error('should not try to set null on duplicate "column" field');
    }
    this.editedStep.column = colname;
  }
}
</script>
