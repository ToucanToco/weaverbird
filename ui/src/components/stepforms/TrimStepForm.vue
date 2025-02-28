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
      :allowCustom="true"
    />
    <StepFormButtonbar />
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';

import type { PipelineStepName, TrimStep } from '@/lib/steps';
import MultiselectWidget from '@/components/stepforms/widgets/Multiselect.vue';
import BaseStepForm from './StepForm.vue';

export default defineComponent({
  name: 'trim-step-form',
  components: {
    MultiselectWidget,
  },
  extends: BaseStepForm,
  props: {
    initialStepValue: {
      type: Object as PropType<TrimStep>,
      default: () => ({ name: 'trim', columns: [] }),
    },
  },
  data() {
    return {
      stepname: 'trim' as PipelineStepName,
      title: 'Trim Columns' as string,
      editedStep: {
        ...this.initialStepValue,
        ...this.stepFormDefaults,
      },
    };
  },
});
</script>
