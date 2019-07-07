<template>
  <div>
    <step-form-title :title="title"></step-form-title>
    <ColumnPicker
      id="valueColumnInput"
      v-model="editedStep.column"
      name="Search min value in..."
      placeholder="Enter a column name"
    ></ColumnPicker>
    <WidgetMultiselect
      id="groupbyColumnsInput"
      v-model="editedStep.groups"
      name="(Optional) Group by..."
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
import ColumnPicker from '@/components/stepforms/ColumnPicker.vue';
import WidgetMultiselect from './WidgetMultiselect.vue';
import BaseStepForm from './StepForm.vue';
import { StepFormComponent } from '@/components/formlib';

@StepFormComponent({
  vqbstep: 'argmax',
  name: 'argmax-step-form',
  components: {
    ColumnPicker,
    WidgetMultiselect,
  },
})
export default class ArgmaxStepForm extends BaseStepForm<ArgmaxStep> {
  @Prop({ type: Object, default: () => ({ name: 'argmax', column: '' }) })
  initialStepValue!: ArgmaxStep;

  readonly title: string = 'Argmax';
}
</script>
