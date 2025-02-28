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
      name="Search max value in..."
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
import type { ArgmaxStep, PipelineStepName } from '@/lib/steps';

import BaseStepForm from './StepForm.vue';
import MultiselectWidget from './widgets/Multiselect.vue';

export default defineComponent({
  name: 'argmax-step-form',

  components: {
    ColumnPicker,
    MultiselectWidget,
  },

  extends: BaseStepForm,

  props: {
    initialStepValue: {
      type: Object as PropType<ArgmaxStep>,
      default: (): ArgmaxStep => ({
        name: 'argmax',
        column: '',
        groups: [],
      }),
    },
  },

  data(): {
    stepname: PipelineStepName;
    title: string;
    editedStep: ArgmaxStep;
  } {
    return {
      stepname: 'argmax',
      title: 'Argmax',
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
