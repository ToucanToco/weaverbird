<template>
  <div>
    <StepFormHeader :title="title" :stepName="this.editedStep.name" />
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
import { Prop } from 'vue-property-decorator';

import { StepFormComponent } from '@/components/formlib';
import { UniqueGroupsStep } from '@/lib/steps';

import BaseStepForm from './StepForm.vue';
import MultiselectWidget from './widgets/Multiselect.vue';

@StepFormComponent({
  vqbstep: 'uniquegroups',
  name: 'uniquegroups-step-form',
  components: {
    MultiselectWidget,
  },
})
export default class UniqueGroupsStepForm extends BaseStepForm<UniqueGroupsStep> {
  @Prop({ type: Object, default: () => ({ name: 'uniquegroups', on: [] }) })
  initialStepValue!: UniqueGroupsStep;

  readonly title: string = 'Get unique groups/values';
}
</script>
