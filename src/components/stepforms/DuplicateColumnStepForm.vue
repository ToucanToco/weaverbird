<template>
  <div>
    <StepFormHeader :title="title" :stepName="this.editedStep.name" />
    <ColumnPicker
      id="columnInput"
      v-model="editedStep.column"
      name="Duplicate column..."
      placeholder="Enter a column"
      data-path=".column"
      :errors="errors"
    />
    <InputTextWidget
      id="newColumnNameInput"
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
import { Prop } from 'vue-property-decorator';

import { StepFormComponent } from '@/components/formlib';
import ColumnPicker from '@/components/stepforms/ColumnPicker.vue';
import InputTextWidget from '@/components/stepforms/widgets/InputText.vue';
import { DuplicateColumnStep } from '@/lib/steps';

import BaseStepForm from './StepForm.vue';

@StepFormComponent({
  vqbstep: 'duplicate',
  name: 'duplicate-step-form',
  components: {
    ColumnPicker,
    InputTextWidget,
  },
})
export default class DuplicateColumnForm extends BaseStepForm<DuplicateColumnStep> {
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
