<template>
  <div>
    <StepFormHeader
      :title="title"
      :stepName="editedStep.name"
      :version="version"
      :backendError="backendError"
    />
    <MultiselectWidget
      class="columnsInput"
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
import Component from 'vue-class-component';
import { Prop } from 'vue-property-decorator';

import MultiselectWidget from '@/components/stepforms/widgets/Multiselect.vue';
import { DeleteStep, PipelineStepName } from '@/lib/steps';

import BaseStepForm from './StepForm.vue';

@Component({
  name: 'delete-step-form',
  components: {
    MultiselectWidget,
  },
})
export default class DeleteStepForm extends BaseStepForm<DeleteStep> {
  stepname: PipelineStepName = 'delete';

  @Prop({ type: Object, default: () => ({ name: 'delete', columns: [] }) })
  initialStepValue!: DeleteStep;

  readonly title: string = 'Delete Columns';
}
</script>
