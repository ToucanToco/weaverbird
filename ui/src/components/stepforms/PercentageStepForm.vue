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
      name="Value column..."
      placeholder="Enter a column"
      data-path=".column"
      :errors="errors"
      :columnNames="columnNames"
      :selectedColumns="selectedColumns"
      @setSelectedColumns="setSelectedColumns"
    />
    <MultiselectWidget
      class="groupbyColumnsInput"
      v-model="editedStep.group"
      name="(Optional) Group by..."
      :options="columnNames"
      placeholder="Add columns"
      data-path=".group"
      :errors="errors"
      :allowCustom="true"
    />
    <InputTextWidget
      class="newColumnNameInput"
      v-model="editedStep.newColumnName"
      name="(Optional) New column name:"
      :placeholder="`${editedStep.column}_PCT`"
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
import type { PercentageStep, PipelineStepName } from '@/lib/steps';

import BaseStepForm from './StepForm.vue';
import InputTextWidget from './widgets/InputText.vue';
import MultiselectWidget from './widgets/Multiselect.vue';

@Component({
  name: 'percentage-step-form',
  components: {
    ColumnPicker,
    InputTextWidget,
    MultiselectWidget,
  },
})
export default class PercentageStepForm extends BaseStepForm<PercentageStep> {
  stepname: PipelineStepName = 'percentage';

  @Prop({ type: Object, default: () => ({ name: 'percentage', column: '' }) })
  declare initialStepValue: PercentageStep;

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
