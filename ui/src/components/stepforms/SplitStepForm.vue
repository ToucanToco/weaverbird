<template>
  <div>
    <StepFormHeader
      :title="title"
      :stepName="editedStep.name"
      :version="version"
      :backendError="backendError"
    />
    <ColumnPicker
      class="columnToSplit"
      v-model="editedStep.column"
      name="Split column..."
      placeholder="Enter a column"
      data-path=".column"
      :errors="errors"
      :columnNames="columnNames"
      :selectedColumns="selectedColumns"
      @setSelectedColumns="setSelectedColumns"
    />
    <InputTextWidget
      class="delimiter"
      v-model="editedStep.delimiter"
      name="Delimiter:"
      placeholder="Enter a text delimiter"
      data-path=".delimiter"
      :errors="errors"
    />
    <InputTextWidget
      class="numberColsToKeep"
      v-model.number="editedStep.numberColsToKeep"
      type="number"
      name="Number of columns to keep:"
      placeholder="Enter an integer"
      data-path=".numberColsToKeep"
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
import type { PipelineStepName, SplitStep } from '@/lib/steps';

import BaseStepForm from './StepForm.vue';

@Component({
  name: 'split-step-form',
  components: {
    ColumnPicker,
    InputTextWidget,
  },
})
export default class SplitStepForm extends BaseStepForm<SplitStep> {
  stepname: PipelineStepName = 'split';

  @Prop({
    type: Object,
    default: () => ({ name: 'split', column: '', delimiter: '' }),
  })
  declare initialStepValue: SplitStep;

  readonly title: string = 'Split column';

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
