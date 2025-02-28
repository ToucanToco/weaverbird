<template>
  <div>
    <StepFormHeader
      :title="title"
      :stepName="editedStep.name"
      :version="version"
      :backendError="backendError"
    />
    <MultiselectWidget
      class="groupbyColumnsInput"
      v-model="editedStep.on"
      name="Get unique groups/values in columns:"
      :options="columnNames"
      @input="setSelectedColumns({ column: editedStep.on[editedStep.on.length - 1] })"
      placeholder="Add columns"
      data-path=".on"
      :errors="errors"
      :allowCustom="true"
    />
    <StepFormButtonbar />
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';

import type { PipelineStepName, UniqueGroupsStep } from '@/lib/steps';
import BaseStepForm from './StepForm.vue';
import MultiselectWidget from './widgets/Multiselect.vue';

export default defineComponent({
  name: 'uniquegroups-step-form',
  components: {
    MultiselectWidget,
  },
  extends: BaseStepForm,
  props: {
    initialStepValue: {
      type: Object as PropType<UniqueGroupsStep>,
      default: () => ({ name: 'uniquegroups', on: [] }),
    },
  },
  data() {
    return {
      stepname: 'uniquegroups' as PipelineStepName,
      title: 'Get unique groups/values' as string,
      editedStep: {
        ...this.initialStepValue,
        ...this.stepFormDefaults,
      },
    };
  },
});
</script>
