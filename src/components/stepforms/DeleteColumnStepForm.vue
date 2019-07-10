<template>
  <div>
    <step-form-title :title="title"></step-form-title>
    <WidgetMultiselect
      id="columnsInput"
      v-model="editedStep.columns"
      name="Delete columns..."
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
import { DeleteStep } from '@/lib/steps';

@StepFormComponent({
  vqbstep: 'delete',
  name: 'delete-step-form',
  components: {
    WidgetMultiselect,
  },
})
export default class DeleteStepForm extends BaseStepForm<DeleteStep> {
  @Prop({ type: Object, default: () => ({ name: 'delete', columns: [] }) })
  initialStepValue!: DeleteStep;

  readonly title: string = 'Delete Columns';
}
</script>
