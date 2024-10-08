<template>
  <div>
    <StepFormHeader
      :title="title"
      :stepName="editedStep.name"
      :version="version"
      :backendError="backendError"
    />
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
      :trusted-variable-delimiters="trustedVariableDelimiters"
      :columnNames="columnNames"
      :selectedColumns="selectedColumns"
      @setSelectedColumns="setSelectedColumns"
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
      v-model="editedStep.newColumnName"
      name="New column name:"
      placeholder="Enter a columnn name"
      data-path=".newColumnName"
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
import ListWidget from '@/components/stepforms/widgets/List.vue';
import type { ConcatenateStep, PipelineStepName } from '@/lib/steps';

import BaseStepForm from './StepForm.vue';

@Component({
  name: 'concatenate-step-form',
  components: {
    ColumnPicker,
    InputTextWidget,
    ListWidget,
  },
})
export default class ConcatenateStepForm extends BaseStepForm<ConcatenateStep> {
  stepname: PipelineStepName = 'concatenate';

  @Prop({
    type: Object,
    default: () => ({ name: 'concatenate', columns: [''], separator: '', newColumnName: '' }),
  })
  declare initialStepValue: ConcatenateStep;

  readonly title: string = 'Concatenate columns';
  columnPicker = ColumnPicker;

  mounted() {
    // If a column is selected, use it to set the first "column" property
    if (this.isStepCreation && this.selectedColumns[0]) {
      this.editedStep = {
        name: 'concatenate' as 'concatenate',
        columns: [this.selectedColumns[0]],
        separator: '',
        newColumnName: '',
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
