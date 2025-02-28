<template>
  <div>
    <StepFormHeader
      :title="title"
      :stepName="editedStep.name"
      :version="version"
      :backendError="backendError"
    />
    <ColumnPicker
      class="columnInput"
      v-model="editedStep.column"
      name="Convert column..."
      placeholder="Enter a column"
      data-path=".column"
      :errors="errors"
      :columnNames="columnNames"
      :selectedColumns="selectedColumns"
      @setSelectedColumns="setSelectedColumns"
    />
    <StepFormButtonbar />
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';

import type { PipelineStepName, ToUpperStep } from '@/lib/steps';
import ColumnPicker from '@/components/stepforms/ColumnPicker.vue';
import BaseStepForm from './StepForm.vue';

export default defineComponent({
  name: 'toupper-step-form',
  components: {
    ColumnPicker,
  },
  extends: BaseStepForm,
  props: {
    initialStepValue: {
      type: Object as PropType<ToUpperStep>,
      default: () => ({ name: 'uppercase', column: '' }),
    },
  },
  data() {
    return {
      stepname: 'uppercase' as PipelineStepName,
      title: 'Convert column to uppercase' as string,
      editedStep: {
        ...this.initialStepValue,
        ...this.stepFormDefaults,
      },
    };
  },
  computed: {
    stepSelectedColumn: {
      get(): string {
        return this.editedStep.column;
      },
      set(colname: string | null) {
        if (colname === null) {
          throw new Error('should not try to set null on "column" field');
        }
        this.editedStep.column = colname;
      },
    },
  },
});
</script>
