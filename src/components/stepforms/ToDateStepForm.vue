<template>
  <div>
    <step-form-title :title="title" />
    <ColumnPicker
      id="column"
      v-model="editedStep.column"
      name="Column to convert:"
      :options="columnNames"
      placeholder="Add columns"
      data-path=".columns"
      :errors="errors"
    />
    <step-form-buttonbar :cancel="cancelEdition" :submit="submit" />
  </div>
</template>

<script lang="ts">
import { Prop } from 'vue-property-decorator';
import { StepFormComponent } from '@/components/formlib';
import ColumnPicker from '@/components/stepforms/ColumnPicker.vue';
import BaseStepForm from './StepForm.vue';
import { ToDateStep } from '@/lib/steps';

@StepFormComponent({
  vqbstep: 'todate',
  name: 'todate-step-form',
  components: {
    ColumnPicker,
  },
})
export default class ToDateStepForm extends BaseStepForm<ToDateStep> {
  @Prop({ type: Object, default: () => ({ name: 'todate', column: '' }) })
  initialStepValue!: ToDateStep;

  readonly title: string = 'Convert Column From Text to Date';

  get stepSelectedColumn() {
    return this.editedStep.column;
  }

  set stepSelectedColumn(colname: string | null) {
    if (colname === null) {
      throw new Error('should not try to set null on "column" field');
    }
    this.editedStep.column = colname;
  }
}
</script>
