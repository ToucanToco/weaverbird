<template>
  <div>
    <StepFormHeader :title="title" :stepName="this.editedStep.name" />
    <ColumnPicker
      id="valueColumnInput"
      v-model="editedStep.column"
      name="Value column..."
      placeholder="Enter a column"
      data-path=".column"
      :errors="errors"
    />
    <MultiselectWidget
      id="groupbyColumnsInput"
      v-model="editedStep.group"
      name="(Optional) Group by..."
      :options="columnNames"
      placeholder="Add columns"
      data-path=".group"
      :errors="errors"
    />
    <StepFormButtonbar />
  </div>
</template>

<script lang="ts">
import { Prop } from 'vue-property-decorator';

import { StepFormComponent } from '@/components/formlib';
import ColumnPicker from '@/components/stepforms/ColumnPicker.vue';
import { PercentageStep } from '@/lib/steps';

import BaseStepForm from './StepForm.vue';
import MultiselectWidget from './widgets/Multiselect.vue';

@StepFormComponent({
  vqbstep: 'percentage',
  name: 'percentage-step-form',
  components: {
    ColumnPicker,
    MultiselectWidget,
  },
})
export default class PercentageStepForm extends BaseStepForm<PercentageStep> {
  @Prop({ type: Object, default: () => ({ name: 'percentage', column: '' }) })
  initialStepValue!: PercentageStep;

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
