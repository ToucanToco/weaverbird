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
      name="Value column:"
      placeholder="Select a column"
      data-path=".column"
      :errors="errors"
      :columnNames="columnNames"
      :selectedColumns="selectedColumns"
      @setSelectedColumns="setSelectedColumns"
    />
    <InputTextWidget
      class="newColumnInput"
      v-model="editedStep.newColumn"
      name="New column:"
      placeholder="Enter a new column name"
      data-path=".newColumn"
      :errors="errors"
      :warning="duplicateColumnName"
      :available-variables="availableVariables"
      :variable-delimiters="variableDelimiters"
      :trusted-variable-delimiters="trustedVariableDelimiters"
    />
    <StepFormButtonbar />
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';

import InputTextWidget from '@/components/stepforms/widgets/InputText.vue';
import type { AbsoluteValueStep, PipelineStepName } from '@/lib/steps';

import ColumnPicker from './ColumnPicker.vue';
import BaseStepForm from './StepForm.vue';

export default defineComponent({
  name: 'absolutevalue-step-form',

  components: {
    InputTextWidget,
    ColumnPicker,
  },

  extends: BaseStepForm,

  props: {
    initialStepValue: {
      type: Object as PropType<AbsoluteValueStep>,
      default: (): AbsoluteValueStep => ({
        name: 'absolutevalue',
        column: '',
        newColumn: '',
      }),
    },
  },

  data() {
    return {
      stepname: 'absolutevalue' as PipelineStepName,
      title: 'Absolute Value' as const,
    };
  },

  computed: {
    duplicateColumnName() {
      if (this.columnNames.includes(this.editedStep.newColumn)) {
        return `A column name "${this.editedStep.newColumn}" already exists. You will overwrite it.`;
      } else {
        return null;
      }
    },
  },

  methods: {
    submit() {
      this.$$super.submit();
      if (this.errors === null) {
        this.setSelectedColumns({ column: this.editedStep.newColumn });
      }
    },
  },
});
</script>
