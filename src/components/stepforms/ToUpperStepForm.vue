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
      name="Convert column..."
      placeholder="Enter a column"
      data-path=".column"
      :errors="errors"
    />
    <StepFormButtonbar />
  </div>
</template>

<script lang="ts">
import Component from 'vue-class-component';
import { Prop } from 'vue-property-decorator';

import ColumnPicker from '@/components/stepforms/ColumnPicker.vue';
import { PipelineStepName, ToUpperStep } from '@/lib/steps';

import BaseStepForm from './StepForm.vue';

@Component({
  name: 'toupper-step-form',
  components: {
    ColumnPicker,
  },
})
export default class ToUpperStepForm extends BaseStepForm<ToUpperStep> {
  stepname: PipelineStepName = 'uppercase';

  @Prop({ type: Object, default: () => ({ name: 'uppercase', column: '' }) })
  initialStepValue!: ToUpperStep;

  readonly title: string = 'Convert column to uppercase';

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
