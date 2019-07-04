<template>
  <div>
    <step-form-title :title="title"></step-form-title>
    <WidgetMultiselect
      id="columnsInput"
      v-model="editedStep.columns"
      name="Keep columns..."
      :options="columnNames"
      @input="setSelectedColumns({ column: editedStep.columns[editedStep.columns.length-1] })"
      placeholder="Add columns"
    ></WidgetMultiselect>
    <step-form-buttonbar :errors="errors" :cancel="cancelEdition" :submit="submit"></step-form-buttonbar>
  </div>
</template>

<script lang="ts">
import { Prop } from 'vue-property-decorator';
import { StepFormComponent } from '@/components/formlib';
import WidgetMultiselect from '@/components/stepforms/WidgetMultiselect.vue';
import BaseStepForm from './StepForm.vue';
import { SelectStep } from '@/lib/steps';

@StepFormComponent({
  vqbstep: 'select',
  name: 'select-step-form',
  components: {
    WidgetMultiselect,
  },
})
export default class SelectStepForm extends BaseStepForm<SelectStep> {
  @Prop({ type: Object, default: () => ({ name: 'select', columns: [] }) })
  initialStepValue!: SelectStep;

  readonly title: string = 'Keep columns';
}
</script>
