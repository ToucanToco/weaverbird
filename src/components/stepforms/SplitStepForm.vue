<template>
  <div>
    <StepFormHeader :title="title" :stepName="this.editedStep.name" />
    <ColumnPicker
      class="columnToSplit"
      v-model="editedStep.column"
      name="Split column..."
      placeholder="Enter a column"
      data-path=".column"
      :errors="errors"
      :available-variables="availableVariables"
      :variable-delimiters="variableDelimiters"
      :advanced-variable-delimiters="advancedVariableDelimiters"
      :use-advanced-variable="true"
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
      v-model.number="editedStep.number_cols_to_keep"
      type="number"
      name="Number of columns to keep:"
      placeholder="Enter an integer"
      data-path=".number_cols_to_keep"
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
import { SplitStep } from '@/lib/steps';
import { VariableDelimiters, VariablesBucket } from '@/lib/variables';
import { VQBModule } from '@/store';

import BaseStepForm from './StepForm.vue';

@StepFormComponent({
  vqbstep: 'split',
  name: 'split-step-form',
  components: {
    ColumnPicker,
    InputTextWidget,
  },
})
export default class SplitStepForm extends BaseStepForm<SplitStep> {
  @VQBModule.State availableVariables!: VariablesBucket;

  @VQBModule.State variableDelimiters!: VariableDelimiters;

  @VQBModule.State advancedVariableDelimiters!: VariableDelimiters;

  @Prop({
    type: Object,
    default: () => ({ name: 'split', column: '', delimiter: '' }),
  })
  initialStepValue!: SplitStep;

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
