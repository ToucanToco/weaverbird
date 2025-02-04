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
      v-model="editedStep.valueColumn"
      name="Value column:"
      placeholder="Select a column"
      :syncWithSelectedColumn="false"
      data-path=".valueColumn"
      :errors="errors"
      :available-variables="availableVariables"
      :variable-delimiters="variableDelimiters"
      :trusted-variable-delimiters="trustedVariableDelimiters"
      :columnNames="columnNames"
      :selectedColumns="selectedColumns"
      @setSelectedColumns="setSelectedColumns"
    />
    <ColumnPicker
      class="columnToSortInput"
      v-model="editedStep.columnToSort"
      name="Reference column to sort (usually dates):"
      placeholder="Select a column"
      :syncWithSelectedColumn="false"
      data-path=".columnToSort"
      :errors="errors"
      :available-variables="availableVariables"
      :variable-delimiters="variableDelimiters"
      :trusted-variable-delimiters="trustedVariableDelimiters"
      :columnNames="columnNames"
      :selectedColumns="selectedColumns"
      @setSelectedColumns="setSelectedColumns"
    />
    <InputTextWidget
      class="movingWindowInput"
      v-model.number="editedStep.movingWindow"
      type="number"
      name="Moving window (in number of rows):"
      placeholder="Enter a number of rows"
      data-path=".limit"
      :errors="movingWindow"
      :available-variables="availableVariables"
      :variable-delimiters="variableDelimiters"
      :trusted-variable-delimiters="trustedVariableDelimiters"
    />
    <MultiselectWidget
      class="groupsInput"
      v-model="editedStep.groups"
      name="(Optional) Group by:"
      :options="columnNames"
      placeholder="Select columns"
      data-path=".groups"
      :errors="errors"
      :available-variables="availableVariables"
      :variable-delimiters="variableDelimiters"
      :trusted-variable-delimiters="trustedVariableDelimiters"
      :allowCustom="true"
    />
    <InputTextWidget
      class="newColumnNameInput"
      v-model="editedStep.newColumnName"
      name="(Optional) New column name:"
      :placeholder="`${editedStep.valueColumn}_MOVING_AVG`"
      data-path=".newColumnName"
      :errors="errors"
    />
    <StepFormButtonbar />
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';

import ColumnPicker from '@/components/stepforms/ColumnPicker.vue';
import InputTextWidget from '@/components/stepforms/widgets/InputText.vue';
import type { MovingAverageStep, PipelineStepName } from '@/lib/steps';

import BaseStepForm from './StepForm.vue';
import MultiselectWidget from './widgets/Multiselect.vue';

export default defineComponent({
  name: 'moving-average-step-form',

  components: {
    ColumnPicker,
    InputTextWidget,
    MultiselectWidget,
  },

  extends: BaseStepForm,

  props: {
    initialStepValue: {
      type: Object as PropType<MovingAverageStep>,
      default: () => ({
        name: 'movingaverage',
        valueColumn: '',
        columnToSort: '',
        movingWindow: null,
      }),
    },
  },

  data() {
    return {
      stepname: 'movingaverage' as PipelineStepName,
      title: 'Computate Moving Average' as const,
      editedStep: {
        ...this.initialStepValue,
        ...this.stepFormDefaults,
      } as MovingAverageStep,
    };
  },
});
</script>
