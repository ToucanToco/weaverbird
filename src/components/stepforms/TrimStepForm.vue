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
      name="Trim columns..."
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
import { TrimStep, PipelineStepName } from '@/lib/steps';

import BaseStepForm from './StepForm.vue';

@Component({
  name: 'trim-step-form',
  components: {
    MultiselectWidget,
  },
})
export default class TrimStepForm extends BaseStepForm<TrimStep> {
  stepname: PipelineStepName = 'trim';

  @Prop({ type: Object, default: () => ({ name: 'trim', columns: [] }) })
  initialStepValue!: TrimStep;

  readonly title: string = 'Trim Columns';
}
</script>
