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
      :allowCustom="true"
    />
    <StepFormButtonbar />
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';

import type { DeleteStep, PipelineStepName } from '@/lib/steps';
import BaseStepForm from './StepForm.vue';
import MultiselectWidget from '@/components/stepforms/widgets/Multiselect.vue';

export default defineComponent({
  name: 'delete-step-form',
  components: {
    MultiselectWidget,
  },
  extends: BaseStepForm,
  props: {
    initialStepValue: {
      type: Object as PropType<DeleteStep>,
      default: () => ({ name: 'delete', columns: [] }),
    },
  },
  data() {
    return {
      stepname: 'delete' as PipelineStepName,
      title: 'Delete Columns' as string,
      editedStep: {
        ...this.initialStepValue,
        ...this.stepFormDefaults,
      },
    };
  },
});
</script>
