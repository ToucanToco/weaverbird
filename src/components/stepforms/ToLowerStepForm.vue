<template>
  <div>
    <step-form-title :title="title" :stepName="this.editedStep.name" />
    <ColumnPicker
      id="columnInput"
      v-model="editedStep.column"
      name="Convert column..."
      placeholder="Enter a column"
      data-path=".column"
      :errors="errors"
    />
    <step-form-buttonbar :cancel="cancelEdition" :submit="submit" />
  </div>
</template>

<script lang="ts">
import { Prop } from 'vue-property-decorator';

import { StepFormComponent } from '@/components/formlib';
import ColumnPicker from '@/components/stepforms/ColumnPicker.vue';
import { ToLowerStep } from '@/lib/steps';

import BaseStepForm from './StepForm.vue';

@StepFormComponent({
  vqbstep: 'lowercase',
  name: 'tolower-step-form',
  components: {
    ColumnPicker,
  },
})
export default class ToLowerStepForm extends BaseStepForm<ToLowerStep> {
  @Prop({ type: Object, default: () => ({ name: 'lowercase', column: '' }) })
  initialStepValue!: ToLowerStep;

  readonly title: string = 'Convert column to lowercase';

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
