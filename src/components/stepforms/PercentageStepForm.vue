<template>
  <div>
    <step-form-title :title="title"></step-form-title>
    <ColumnPicker
      id="valueColumnInput"
      v-model="editedStep.column"
      name="Value column..."
      placeholder="Enter a column"
      data-path=".column"
      :errors="errors"
    ></ColumnPicker>
    <MultiselectWidget
      id="groupbyColumnsInput"
      v-model="editedStep.group"
      name="(Optional) Group by..."
      :options="columnNames"
      placeholder="Add columns"
      data-path=".group"
      :errors="errors"
    ></MultiselectWidget>
    <InputTextWidget
      id="newColumnNameInput"
      v-model="editedStep.new_column"
      name="(Optional) New column name..."
      placeholder="Enter a new column name"
      data-path=".new_column"
      :errors="errors"
    ></InputTextWidget>
    <step-form-buttonbar :cancel="cancelEdition" :submit="submit"></step-form-buttonbar>
  </div>
</template>

<script lang="ts">
import { Prop } from 'vue-property-decorator';
import { PercentageStep } from '@/lib/steps';
import ColumnPicker from '@/components/stepforms/ColumnPicker.vue';
import InputTextWidget from './widgets/InputText.vue';
import MultiselectWidget from './widgets/Multiselect.vue';
import BaseStepForm from './StepForm.vue';
import { StepFormComponent } from '@/components/formlib';

@StepFormComponent({
  vqbstep: 'percentage',
  name: 'percentage-step-form',
  components: {
    ColumnPicker,
    InputTextWidget,
    MultiselectWidget,
  },
})
export default class PercentageStepForm extends BaseStepForm<PercentageStep> {
  @Prop({ type: Object, default: () => ({ name: 'percentage', column: '' }) })
  initialStepValue!: PercentageStep;

  readonly title: string = 'Percentage of total';

  get stepSelectedColumn() {
    return this.editedStep.column;
  }

  set stepSelectedColumn(colname: string | null) {
    if (colname === null) {
      throw new Error('should not try to set null on percentage "value column" field');
    }
    if (colname !== null) {
      this.editedStep.column = colname;
    }
  }
}
</script>
