<template>
  <div>
    <StepFormHeader
      :title="title"
      :stepName="editedStep.name"
      :version="version"
      :backendError="backendError"
    />
    <ColumnPicker
      class="valueColumnInput"
      v-model="editedStep.column"
      name="Search min value in..."
      placeholder="Enter a column name"
      data-path=".column"
      :errors="errors"
      :available-variables="availableVariables"
      :variable-delimiters="variableDelimiters"
      :trusted-variable-delimiters="trustedVariableDelimiters"
      :columnNames="columnNames"
      :selectedColumns="selectedColumns"
      @setSelectedColumns="setSelectedColumns"
    />
    <MultiselectWidget
      class="groupbyColumnsInput"
      v-model="editedStep.groups"
      name="(Optional) Group by..."
      :options="columnNames"
      placeholder="Add columns"
      data-path=".groups"
      :errors="errors"
      :available-variables="availableVariables"
      :variable-delimiters="variableDelimiters"
      :trusted-variable-delimiters="trustedVariableDelimiters"
      :allowCustom="true"
    />
    <StepFormButtonbar />
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';

import ColumnPicker from '@/components/stepforms/ColumnPicker.vue';
import type { ArgminStep, PipelineStepName } from '@/lib/steps';

import BaseStepForm from './StepForm.vue';
import MultiselectWidget from './widgets/Multiselect.vue';

export default defineComponent({
  name: 'argmin-step-form',

  components: {
    ColumnPicker,
    MultiselectWidget,
  },

  extends: BaseStepForm,

  props: {
    initialStepValue: {
      type: Object as PropType<ArgminStep>,
      default: () => ({
        name: 'argmin',
        column: ''
      }),
    },
  },

  data(): {
    stepname: PipelineStepName;
    title: string;
    editedStep: ArgminStep;
  } {
    return {
      stepname: 'argmin',
      title: 'Argmin',
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
