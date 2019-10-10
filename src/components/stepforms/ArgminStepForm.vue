<template>
  <div>
    <step-form-title :title="title"/>
    <ColumnPicker
      id="valueColumnInput"
      v-model="editedStep.column"
      name="Search min value in..."
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
    <step-form-buttonbar :cancel="cancelEdition" :submit="submit"/>
  </div>
</template>

<script lang="ts">
import { Prop } from 'vue-property-decorator';
import { ArgminStep } from '@/lib/steps';
import ColumnPicker from '@/components/stepforms/ColumnPicker.vue';
import MultiselectWidget from './widgets/Multiselect.vue';
import BaseStepForm from './StepForm.vue';
import { StepFormComponent } from '@/components/formlib';

@StepFormComponent({
  vqbstep: 'argmin',
  name: 'argmin-step-form',
  components: {
    ColumnPicker,
    MultiselectWidget,
  },
})
export default class ArgminStepForm extends BaseStepForm<ArgminStep> {
  @Prop({ type: Object, default: () => ({ name: 'argmin', column: '' }) })
  initialStepValue!: ArgminStep;

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
