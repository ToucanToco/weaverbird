<template>
  <div>
    <StepFormHeader :title="title" :stepName="this.editedStep.name" />
    <ColumnPicker
      id="column"
      v-model="editedStep.column"
      name="Column to convert:"
      :options="columnNames"
      placeholder="Add columns"
      data-path=".column"
      :errors="errors"
    />
    <InputTextWidget
      id="format"
      v-model="editedStep.format"
      name="Date format of output text:"
      placeholder="Enter a date format"
      data-path=".format"
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
import { FromDateStep } from '@/lib/steps';

import BaseStepForm from './StepForm.vue';

@StepFormComponent({
  vqbstep: 'fromdate',
  name: 'fromdate-step-form',
  components: {
    ColumnPicker,
    InputTextWidget,
  },
})
export default class FromDateStepForm extends BaseStepForm<FromDateStep> {
  @Prop({ type: Object, default: () => ({ name: 'fromdate', column: '', format: '' }) })
  initialStepValue!: FromDateStep;

  readonly title: string = 'Convert Column From Date to Text';

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
