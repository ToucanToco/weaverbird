<template>
  <div>
    <StepFormHeader :title="title" :stepName="this.editedStep.name" />
    <ListWidget
      addFieldName="Add columns"
      class="toConcatenate"
      name="Columns to concatenate:"
      v-model="toConcatenate"
      :defaultItem="[]"
      :widget="columnPicker"
      :componentProps="{ syncWithSelectedColumn: false }"
      :automatic-new-field="false"
      data-path=".columns"
      :errors="errors"
      :available-variables="availableVariables"
      :variable-delimiters="variableDelimiters"
      :advanced-variable-delimiters="advancedVariableDelimiters"
    />
    <InputTextWidget
      class="separator"
      v-model="editedStep.separator"
      name="Separator:"
      placeholder="Enter string of any length"
      data-path=".separator"
      :errors="errors"
    />
    <InputTextWidget
      class="newColumnName"
      v-model="editedStep.new_column_name"
      name="New column name:"
      placeholder="Enter a columnn name"
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
import ListWidget from '@/components/stepforms/widgets/List.vue';
import { ConcatenateStep } from '@/lib/steps';
import { VariableDelimiters, VariablesBucket } from '@/lib/variables';
import { VQBModule } from '@/store';

import BaseStepForm from './StepForm.vue';

@StepFormComponent({
  vqbstep: 'concatenate',
  name: 'concatenate-step-form',
  components: {
    ColumnPicker,
    InputTextWidget,
    ListWidget,
  },
})
export default class ConcatenateStepForm extends BaseStepForm<ConcatenateStep> {
  @VQBModule.State availableVariables!: VariablesBucket;

  @VQBModule.State variableDelimiters!: VariableDelimiters;

  @VQBModule.State advancedVariableDelimiters!: VariableDelimiters;

  @Prop({
    type: Object,
    default: () => ({ name: 'concatenate', columns: [''], separator: '', new_column_name: '' }),
  })
  initialStepValue!: ConcatenateStep;

  readonly title: string = 'Concatenate columns';
  columnPicker = ColumnPicker;

  mounted() {
    // If a column is selected, use it to set the first "column" property
    if (this.isStepCreation && this.selectedColumns[0]) {
      this.editedStep = {
        name: 'concatenate' as 'concatenate',
        columns: [this.selectedColumns[0]],
        separator: '',
        new_column_name: '',
      };
    } else {
      // Otherwise, fallback on the default initial value
      this.editedStep = { ...this.initialStepValue };
    }
  }

  get toConcatenate() {
    if (this.editedStep.columns.length) {
      return this.editedStep.columns;
    } else {
      return [''];
    }
  }

  set toConcatenate(newval) {
    this.editedStep.columns = [...newval];
  }
}
</script>
