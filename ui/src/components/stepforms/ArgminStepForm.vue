<template>
  <div>
    <StepFormHeader
      :title="title"
      :stepName="editedStep.name"
      :version="version"
      :backendError="backendError"
    />
    <ColumnPicker
      class="valueColumnInput"
      v-model="editedStep.column"
      name="Search min value in..."
      placeholder="Enter a column name"
      data-path=".column"
      :errors="errors"
      :available-variables="availableVariables"
      :variable-delimiters="variableDelimiters"
      :trusted-variable-delimiters="trustedVariableDelimiters"
      :columnNames="columnNames"
      :selectedColumns="selectedColumns"
      @setSelectedColumns="setSelectedColumns"
    />
    <MultiselectWidget
      class="groupbyColumnsInput"
      v-model="editedStep.groups"
      name="(Optional) Group by..."
      :options="columnNames"
      placeholder="Add columns"
      data-path=".groups"
      :errors="errors"
      :available-variables="availableVariables"
      :variable-delimiters="variableDelimiters"
      :trusted-variable-delimiters="trustedVariableDelimiters"
      :allowCustom="true"
    />
    <StepFormButtonbar />
  </div>
</template>

<script lang="ts">
import Component from 'vue-class-component';
import { Prop } from 'vue-property-decorator';

import ColumnPicker from '@/components/stepforms/ColumnPicker.vue';
import type { ArgminStep, PipelineStepName } from '@/lib/steps';

import BaseStepForm from './StepForm.vue';
import MultiselectWidget from './widgets/Multiselect.vue';

@Component({
  name: 'argmin-step-form',
  components: {
    ColumnPicker,
    MultiselectWidget,
  },
})
export default class ArgminStepForm extends BaseStepForm<ArgminStep> {
  stepname: PipelineStepName = 'argmin';

  @Prop({ type: Object, default: () => ({ name: 'argmin', column: '' }) })
  declare initialStepValue: ArgminStep;

  readonly title: string = 'Argmin';

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
