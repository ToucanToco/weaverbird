<template>
  <div>
    <step-form-title :title="title" :stepName="this.editedStep.name" />
    <ColumnPicker
      id="valueColumnInput"
      v-model="editedStep.column"
      name="Search max value in..."
      placeholder="Enter a column name"
      data-path=".column"
      :errors="errors"
    />
    <MultiselectWidget
      id="groupbyColumnsInput"
      v-model="editedStep.groups"
      name="(Optional) Group by..."
      :options="columnNames"
      placeholder="Add columns"
      data-path=".groups"
      :errors="errors"
    />
    <step-form-buttonbar :cancel="cancelEdition" :submit="submit" />
  </div>
</template>

<script lang="ts">
import { Prop } from 'vue-property-decorator';

import { ArgmaxStep } from '@/lib/steps';
import ColumnPicker from '@/components/stepforms/ColumnPicker.vue';
import { StepFormComponent } from '@/components/formlib';

import MultiselectWidget from './widgets/Multiselect.vue';
import BaseStepForm from './StepForm.vue';

@StepFormComponent({
  vqbstep: 'argmax',
  name: 'argmax-step-form',
  components: {
    ColumnPicker,
    MultiselectWidget,
  },
})
export default class ArgmaxStepForm extends BaseStepForm<ArgmaxStep> {
  @Prop({ type: Object, default: () => ({ name: 'argmax', column: '' }) })
  initialStepValue!: ArgmaxStep;

  readonly title: string = 'Argmax';

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
