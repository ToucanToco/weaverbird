<template>
  <div>
    <StepFormHeader
      :title="title"
      :stepName="editedStep.name"
      :version="version"
      :backendError="backendError"
    />
    <ColumnPicker
      class="columnToSplit"
      v-model="editedStep.column"
      name="Split column..."
      placeholder="Enter a column"
      data-path=".column"
      :errors="errors"
      :available-variables="availableVariables"
      :variable-delimiters="variableDelimiters"
      :trusted-variable-delimiters="trustedVariableDelimiters"
      :columnNames="columnNames"
      :selectedColumns="selectedColumns"
      @setSelectedColumns="setSelectedColumns"
    />
    <InputTextWidget
      class="delimiter"
      v-model="editedStep.delimiter"
      name="Delimiter:"
      placeholder="Enter a text delimiter"
      data-path=".delimiter"
      :errors="errors"
    />
    <InputTextWidget
      class="numberColsToKeep"
      v-model.number="editedStep.numberColsToKeep"
      type="number"
      name="Number of columns to keep:"
      placeholder="Enter an integer"
      data-path=".numberColsToKeep"
      :errors="errors"
    />
    <StepFormButtonbar />
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';

import type { PipelineStepName, SplitStep } from '@/lib/steps';
import BaseStepForm from './StepForm.vue';
import ColumnPicker from '@/components/stepforms/ColumnPicker.vue';
import InputTextWidget from '@/components/stepforms/widgets/InputText.vue';

export default defineComponent({
  name: 'split-step-form',
  components: {
    ColumnPicker,
    InputTextWidget,
  },
  extends: BaseStepForm,
  props: {
    initialStepValue: {
      type: Object as PropType<SplitStep>,
      default: () => ({ name: 'split', column: '', delimiter: '' }),
    },
  },
  data() {
    return {
      stepname: 'split' as PipelineStepName,
      title: 'Split column' as string,
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
