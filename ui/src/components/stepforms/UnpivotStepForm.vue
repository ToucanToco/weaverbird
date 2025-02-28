<template>
  <div>
    <StepFormHeader
      :title="title"
      :stepName="editedStep.name"
      :version="version"
      :backendError="backendError"
    />
    <MultiselectWidget
      class="keepColumnInput"
      v-model="editedStep.keep"
      name="Keep columns..."
      :options="columnNames"
      @input="setSelectedColumns({ column: editedStep.keep[0] })"
      placeholder="Add columns to keep"
      data-path=".keep"
      :errors="errors"
      :available-variables="availableVariables"
      :variable-delimiters="variableDelimiters"
      :trusted-variable-delimiters="trustedVariableDelimiters"
      :allowCustom="true"
    />
    <MultiselectWidget
      class="unpivotColumnInput"
      v-model="editedStep.unpivot"
      name="Unpivot columns..."
      :options="columnNames"
      @input="setSelectedColumns({ column: editedStep.unpivot[0] })"
      placeholder="Add columns to unpivot"
      data-path=".unpivot"
      :errors="errors"
      :available-variables="availableVariables"
      :variable-delimiters="variableDelimiters"
      :trusted-variable-delimiters="trustedVariableDelimiters"
      :allowCustom="true"
    />
    <CheckboxWidget
      v-if="translator !== 'snowflake'"
      class="dropnaCheckbox"
      :label="checkboxLabel"
      v-model="editedStep.dropna"
    />
    <StepFormButtonbar />
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';

import type { PipelineStepName, UnpivotStep } from '@/lib/steps';
import { generateNewColumnName } from '@/lib/helpers';
import BaseStepForm from './StepForm.vue';
import CheckboxWidget from '@/components/stepforms/widgets/Checkbox.vue';
import MultiselectWidget from '@/components/stepforms/widgets/Multiselect.vue';

export default defineComponent({
  name: 'unpivot-step-form',
  components: {
    CheckboxWidget,
    MultiselectWidget,
  },
  extends: BaseStepForm,
  props: {
    initialStepValue: {
      type: Object as PropType<UnpivotStep>,
      default: () => ({
        name: 'unpivot',
        keep: [],
        unpivot: [],
        unpivotColumnName: '',
        valueColumnName: '',
        dropna: true,
      }),
    },
  },
  data() {
    return {
      stepname: 'unpivot' as PipelineStepName,
      title: 'Unpivot columns' as string,
      checkboxLabel: 'Drop null values' as string,
      editedStep: {
        ...this.initialStepValue,
        ...this.stepFormDefaults,
      },
    };
  },
  methods: {
    submit() {
      this.editedStep.unpivotColumnName = generateNewColumnName('variable', this.columnNames);
      this.editedStep.valueColumnName = generateNewColumnName('value', this.columnNames);
      this.$$super.submit();
    },
  },
});
</script>
