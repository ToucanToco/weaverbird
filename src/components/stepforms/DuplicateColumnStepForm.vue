<template>
  <div>
    <step-form-title :title="title"></step-form-title>
    <ColumnPicker
      id="columnInput"
      v-model="editedStep.column"
      name="Duplicate column..."
      placeholder="Enter a column"
    ></ColumnPicker>
    <WidgetInputText
      id="newColumnNameInput"
      v-model="editedStep.new_column_name"
      name="New column name:"
      placeholder="Enter a column name"
    ></WidgetInputText>
    <step-form-buttonbar :errors="errors" :cancel="cancelEdition" :submit="submit"></step-form-buttonbar>
  </div>
</template>

<script lang="ts">
import { Prop } from 'vue-property-decorator';
import { StepFormComponent } from '@/components/formlib';
import ColumnPicker from '@/components/stepforms/ColumnPicker.vue';
import WidgetInputText from '@/components/stepforms/WidgetInputText.vue';
import BaseStepForm from './StepForm.vue';
import { DuplicateColumnStep } from '@/lib/steps';

@StepFormComponent({
  vqbstep: 'duplicate',
  name: 'duplicate-step-form',
  components: {
    ColumnPicker,
    WidgetInputText,
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
