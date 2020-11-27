<template>
  <div>
    <StepFormHeader :title="title" :stepName="editedStep.name" :version="version" />
    <ColumnPicker
      class="columnInput"
      v-model="editedStep.column"
      name="Duplicate column..."
      placeholder="Enter a column"
      data-path=".column"
      :errors="errors"
    />
    <InputTextWidget
      class="newColumnNameInput"
      v-model="editedStep.new_column_name"
      name="New column name:"
      placeholder="Enter a column name"
      data-path=".new_column_name"
      :errors="errors"
    />
    <StepFormButtonbar />
  </div>
</template>

<script lang="ts">
import Component from 'vue-class-component';
import { Prop } from 'vue-property-decorator';

import { DuplicateColumnStep, PipelineStepName } from '../../lib/steps';
import ColumnPicker from '..//stepforms/ColumnPicker.vue';
import InputTextWidget from '..//stepforms/widgets/InputText.vue';
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

  @Prop({ type: Object, default: () => ({ name: 'duplicate', column: '', new_column_name: '' }) })
  initialStepValue!: DuplicateColumnStep;

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
