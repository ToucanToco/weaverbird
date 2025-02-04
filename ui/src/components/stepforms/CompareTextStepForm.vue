<template>
  <div>
    <StepFormHeader
      :title="title"
      :stepName="editedStep.name"
      :version="version"
      :backendError="backendError"
    />
    <InputTextWidget
      class="newColumnNameInput"
      v-model="editedStep.newColumnName"
      name="New column name (for the comparison result):"
      placeholder="Enter a column name"
      data-path=".newColumnName"
      :errors="errors"
      :warning="duplicateColumnName"
    />
    <ColumnPicker
      class="strCol1Input"
      v-model="editedStep.strCol1"
      name="First text column to compare:"
      placeholder="Select a column"
      data-path=".strCol1"
      :syncWithSelectedColumn="false"
      :errors="errors"
      :available-variables="availableVariables"
      :variable-delimiters="variableDelimiters"
      :trusted-variable-delimiters="trustedVariableDelimiters"
      :columnNames="columnNames"
      :selectedColumns="selectedColumns"
      @setSelectedColumns="setSelectedColumns"
    />
    <ColumnPicker
      class="strCol2Input"
      v-model="editedStep.strCol2"
      name="Second text column to compare:"
      placeholder="Select a column"
      data-path=".strCol2"
      :syncWithSelectedColumn="false"
      :errors="errors"
      :available-variables="availableVariables"
      :variable-delimiters="variableDelimiters"
      :trusted-variable-delimiters="trustedVariableDelimiters"
      :columnNames="columnNames"
      :selectedColumns="selectedColumns"
      @setSelectedColumns="setSelectedColumns"
    />
    <StepFormButtonbar />
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';

import type { CompareTextStep, PipelineStepName } from '@/lib/steps';
import ColumnPicker from '@/components/stepforms/ColumnPicker.vue';
import InputTextWidget from '@/components/stepforms/widgets/InputText.vue';
import BaseStepForm from './StepForm.vue';

export default defineComponent({
  name: 'compare-text-step-form',
  components: {
    ColumnPicker,
    InputTextWidget,
  },
  extends: BaseStepForm,
  props: {
    initialStepValue: {
      type: Object as PropType<CompareTextStep>,
      default: () => ({
        name: 'comparetext',
        newColumnName: '',
        strCol1: '',
        strCol2: '',
      }),
    },
  },
  data(): {
    stepname: PipelineStepName;
    title: string;
    editedStep: CompareTextStep;
  } {
    return {
      stepname: 'comparetext',
      title: 'Compare Text Columns',
      editedStep: {
        ...this.initialStepValue,
        ...this.stepFormDefaults,
      },
    };
  },
  computed: {
    duplicateColumnName(): string | null {
      if (this.columnNames.includes(this.editedStep.newColumnName)) {
        return `A column name "${this.editedStep.newColumnName}" already exists. You will overwrite it.`;
      } else {
        return null;
      }
    },
  },
  methods: {
    submit() {
      this.$$super.submit();
      if (this.errors === null) {
        this.setSelectedColumns({ column: this.editedStep.newColumnName });
      }
    },
  },
});
</script>
