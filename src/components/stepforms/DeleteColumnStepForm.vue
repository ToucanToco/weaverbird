<template>
  <div>
    <StepFormHeader :title="title" :stepName="this.editedStep.name" />
    <MultiselectWidget
      id="columnsInput"
      v-model="editedStep.columns"
      name="Delete columns..."
      :options="columnNames"
      @input="setSelectedColumns({ column: editedStep.columns[editedStep.columns.length - 1] })"
      placeholder="Add columns"
      data-path=".columns"
      :errors="errors"
    />
    <StepFormButtonbar />
  </div>
</template>

<script lang="ts">
import { Prop } from 'vue-property-decorator';

import { StepFormComponent } from '@/components/formlib';
import MultiselectWidget from '@/components/stepforms/widgets/Multiselect.vue';
import { DeleteStep } from '@/lib/steps';

import BaseStepForm from './StepForm.vue';

@StepFormComponent({
  vqbstep: 'delete',
  name: 'delete-step-form',
  components: {
    MultiselectWidget,
  },
})
export default class DeleteStepForm extends BaseStepForm<DeleteStep> {
  @Prop({ type: Object, default: () => ({ name: 'delete', columns: [] }) })
  initialStepValue!: DeleteStep;

  readonly title: string = 'Delete Columns';
}
</script>
