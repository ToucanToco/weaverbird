<template>
  <div>
    <step-form-title :title="title"></step-form-title>
    <WidgetAutocomplete
      id="valueColumnInput"
      v-model="editedStep.column"
      name="Search max value in:"
      :options="columnNames"
      @input="setSelectedColumns({ column: editedStep.column })"
      placeholder="Enter a column name"
    ></WidgetAutocomplete>
    <WidgetMultiselect
      id="groupbyColumnsInput"
      v-model="editedStep.groups"
      name="Group by:"
      :options="columnNames"
      @input="setSelectedColumns({ column: editedStep.groups[editedStep.groups.length-1] })"
      placeholder="Add columns"
    ></WidgetMultiselect>
    <step-form-buttonbar :errors="errors" :cancel="cancelEdition" :submit="submit"></step-form-buttonbar>
  </div>
</template>

<script lang="ts">
import { Prop } from 'vue-property-decorator';
import { ArgmaxStep } from '@/lib/steps';
import argmaxSchema from '@/assets/schemas/argmax-step__schema.json';
import WidgetAutocomplete from '@/components/stepforms/WidgetAutocomplete.vue';
import WidgetMultiselect from './WidgetMultiselect.vue';
import BaseStepForm from './StepForm.vue';
import { StepFormComponent } from '@/components/formlib';

@StepFormComponent({
  vqbstep: 'argmax',
  name: 'argmax-step-form',
  components: {
    WidgetAutocomplete,
    WidgetMultiselect,
  },
})
export default class ArgmaxStepForm extends BaseStepForm<ArgmaxStep> {
  @Prop({ type: Object, default: () => ({ name: 'argmax', column: '' }) })
  initialStepValue!: ArgmaxStep;

  readonly title: string = 'Edit Argmax Step';
  editedStepModel = argmaxSchema;
}
</script>
