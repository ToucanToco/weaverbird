<template>
  <div>
    <StepFormHeader :title="title" :stepName="editedStep.name" :version="version" />
    <MultiselectWidget
      class="groupbyColumnsInput"
      v-model="editedStep.on"
      name="Get unique groups/values in columns:"
      :options="columnNames"
      @input="setSelectedColumns({ column: editedStep.on[editedStep.on.length - 1] })"
      placeholder="Add columns"
      data-path=".on"
      :errors="errors"
    />
    <StepFormButtonbar />
  </div>
</template>

<script lang="ts">
import Component from 'vue-class-component';
import { Prop } from 'vue-property-decorator';

import { PipelineStepName, UniqueGroupsStep } from '@/lib/steps';

import BaseStepForm from './StepForm.vue';
import MultiselectWidget from './widgets/Multiselect.vue';

@Component({
  name: 'uniquegroups-step-form',
  components: {
    MultiselectWidget,
  },
})
export default class UniqueGroupsStepForm extends BaseStepForm<UniqueGroupsStep> {
  stepname: PipelineStepName = 'uniquegroups';

  @Prop({ type: Object, default: () => ({ name: 'uniquegroups', on: [] }) })
  initialStepValue!: UniqueGroupsStep;

  readonly title: string = 'Get unique groups/values';
}
</script>
