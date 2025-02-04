<template>
  <div>
    <StepFormHeader
      :title="title"
      :stepName="editedStep.name"
      :version="version"
      :backendError="backendError"
    />
    <ListWidget
      addFieldName="Add column"
      class="toReplace"
      name="Columns to cumulate :"
      v-model="toCumSum"
      :defaultItem="['', '']"
      :widget="cumSumWidget"
      :automatic-new-field="false"
      data-path=".toCumSum"
      :errors="errors"
      :available-variables="availableVariables"
      :variable-delimiters="variableDelimiters"
      :trusted-variable-delimiters="trustedVariableDelimiters"
      :columnNames="columnNames"
      :selectedColumns="selectedColumns"
      @setSelectedColumns="setSelectedColumns"
      unstyled-items
    />
    <ColumnPicker
      class="referenceColumnInput"
      v-model="editedStep.referenceColumn"
      name="Reference column to sort (usually dates)"
      placeholder="Enter a column"
      data-path=".referenceColumn"
      :syncWithSelectedColumn="false"
      :errors="errors"
      :columnNames="columnNames"
      :selectedColumns="selectedColumns"
      @setSelectedColumns="setSelectedColumns"
    />
    <MultiselectWidget
      class="groupbyInput"
      v-model="editedStep.groupby"
      name="(Optional) Group cumulated sum by:"
      :options="columnNames"
      placeholder="Add columns"
      data-path=".groupby"
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
import { defineComponent } from 'vue';

import ColumnPicker from '@/components/stepforms/ColumnPicker.vue';
import type { CumSumStep, PipelineStepName } from '@/lib/steps';

import BaseStepForm from './StepForm.vue';
import CumSumWidget from './widgets/CumSum.vue';
import ListWidget from './widgets/List.vue';
import MultiselectWidget from './widgets/Multiselect.vue';

export default defineComponent({
  name: 'cumsum-step-form',

  components: {
    ColumnPicker,
    ListWidget,
    MultiselectWidget,
  },

  extends: BaseStepForm,

  props: {
    initialStepValue: {
      type: Object as () => CumSumStep,
      default: () => ({
        name: 'cumsum',
        toCumSum: [],
        referenceColumn: '',
      }),
    },
  },

  data() {
    return {
      stepname: 'cumsum' as PipelineStepName,
      title: 'Cumulated sum' as const,
      cumSumWidget: CumSumWidget,
      editedStep: {
        ...this.initialStepValue,
        ...this.stepFormDefaults,
      } as CumSumStep,
    };
  },

  computed: {
    toCumSum: {
      get() {
        return this.editedStep.toCumSum;
      },
      set(newval) {
        this.editedStep.toCumSum = [...newval];
      },
    },
  },

  created() {
    /** Overload the definition of editedStep in BaseStepForm to guarantee retro-compatibility,
     *  as we have to manage historical configurations where only one column at a time could be
     * renamed via the 'valueColumn' and 'newColumn' parameter, now optional and not useful. So we
     * convert them into a 'toCumSum' array upfront */
    if ('valueColumn' in this.editedStep && this.editedStep.valueColumn) {
      const valueColumn = this.editedStep.valueColumn;
      delete this.editedStep.valueColumn;
      (this.editedStep as CumSumStep).toCumSum = [[valueColumn, '']];

      if ('newColumn' in this.editedStep && this.editedStep.newColumn) {
        const newColumn = this.editedStep.newColumn;
        delete this.editedStep.newColumn;
        (this.editedStep as CumSumStep).toCumSum[0][1] = newColumn;
      }
    }
  },
});
</script>
