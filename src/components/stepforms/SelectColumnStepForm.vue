<template>
  <div>
    <step-form-title :title="title"></step-form-title>
    <MultiselectWidget
      id="columnsInput"
      v-model="editedStep.columns"
      name="Keep columns..."
      :options="columnNames"
      @input="setSelectedColumns({ column: editedStep.columns[editedStep.columns.length-1] })"
      placeholder="Add columns"
      data-path=".columns"
      :errors="errors"
    ></MultiselectWidget>
    <step-form-buttonbar :cancel="cancelEdition" :submit="submit"></step-form-buttonbar>
  </div>
</template>

<script lang="ts">
import { Prop } from 'vue-property-decorator';
import { StepFormComponent } from '@/components/formlib';
import MultiselectWidget from '@/components/stepforms/widgets/Multiselect.vue';
import BaseStepForm from './StepForm.vue';
import { SelectStep } from '@/lib/steps';

@StepFormComponent({
  vqbstep: 'select',
  name: 'select-step-form',
  components: {
    MultiselectWidget,
  },
})
export default class SelectStepForm extends BaseStepForm<SelectStep> {
  @Prop({ type: Object, default: () => ({ name: 'select', columns: [] }) })
  initialStepValue!: SelectStep;

  readonly title: string = 'Keep columns';
}
</script>
