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
      name="Value column name:"
      placeholder="Select a column"
      data-path=".valueColumn"
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
      class="milestonesColumnInput"
      v-model="editedStep.milestonesColumn"
      name="Column incl. start and end labels (usually dates):"
      placeholder="Select a column"
      data-path=".milestonesColumn"
      :syncWithSelectedColumn="false"
      :errors="errors"
      :available-variables="availableVariables"
      :variable-delimiters="variableDelimiters"
      :trusted-variable-delimiters="trustedVariableDelimiters"
      :columnNames="columnNames"
      :selectedColumns="selectedColumns"
      @setSelectedColumns="setSelectedColumns"
    />
    <InputTextWidget
      class="startInput"
      v-model="editedStep.start"
      name="Starting block label:"
      placeholder="To be found in the column above"
      data-path=".start"
      :errors="errors"
      :available-variables="availableVariables"
      :variable-delimiters="variableDelimiters"
      :trusted-variable-delimiters="trustedVariableDelimiters"
    />
    <InputTextWidget
      class="endInput"
      v-model="editedStep.end"
      name="Ending block label:"
      placeholder="To be found in the column above"
      data-path=".end"
      :errors="errors"
      :available-variables="availableVariables"
      :variable-delimiters="variableDelimiters"
      :trusted-variable-delimiters="trustedVariableDelimiters"
    />
    <ColumnPicker
      class="childrenColumnInput"
      v-model="editedStep.labelsColumn"
      name="Labels columns (for intermediate blocks):"
      placeholder="Select a column"
      data-path=".labelsColumn"
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
      class="parentsColumnInput"
      v-model="editedStep.parentsColumn"
      name="(Optional) Parents labels column (for drill-down):"
      placeholder="Select a column"
      data-path=".parentsColumn"
      :syncWithSelectedColumn="false"
      :errors="errors"
      :available-variables="availableVariables"
      :variable-delimiters="variableDelimiters"
      :trusted-variable-delimiters="trustedVariableDelimiters"
      :columnNames="columnNames"
      :selectedColumns="selectedColumns"
      @setSelectedColumns="setSelectedColumns"
    />
    <MultiselectWidget
      class="groupbyInput"
      v-model="editedStep.groupby"
      name="(Optional) Group waterfall by:"
      :options="columnNames"
      placeholder="Add columns"
      data-path=".groupby"
      :errors="errors"
      :available-variables="availableVariables"
      :variable-delimiters="variableDelimiters"
      :trusted-variable-delimiters="trustedVariableDelimiters"
      :allowCustom="true"
    />
    <AutocompleteWidget
      class="sortByInput"
      name="Sort by:"
      v-model="editedStep.sortBy"
      :options="['label', 'value']"
      data-path=".sortBy"
    />
    <AutocompleteWidget
      class="orderInput"
      name="Sort order:"
      v-model="editedStep.order"
      :options="['asc', 'desc']"
      data-path=".order"
    />
    <CheckboxWidget
      class="backfillCheckbox"
      label="Backfill missing values"
      v-model="editedStep.backfill"
    />
    <StepFormButtonbar />
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';

import AutocompleteWidget from '@/components/stepforms/widgets/Autocomplete.vue';
import InputTextWidget from '@/components/stepforms/widgets/InputText.vue';
import CheckboxWidget from '@/components/stepforms/widgets/Checkbox.vue';
import type { PipelineStepName, WaterfallStep } from '@/lib/steps';
import ColumnPicker from './ColumnPicker.vue';
import BaseStepForm from './StepForm.vue';
import MultiselectWidget from './widgets/Multiselect.vue';

export default defineComponent({
  name: 'waterfall-step-form',
  components: {
    AutocompleteWidget,
    ColumnPicker,
    InputTextWidget,
    MultiselectWidget,
    CheckboxWidget,
  },
  extends: BaseStepForm,
  props: {
    initialStepValue: {
      type: Object as PropType<WaterfallStep>,
      default: () => ({
        name: 'waterfall',
        valueColumn: '',
        milestonesColumn: '',
        start: '',
        end: '',
        labelsColumn: '',
        sortBy: 'value',
        order: 'desc',
        backfill: true,
      }),
    },
  },
  data() {
    return {
      stepname: 'waterfall' as PipelineStepName,
      title: 'Compute waterfall' as string,
      editedStep: {
        ...this.initialStepValue,
        ...this.stepFormDefaults,
      },
    };
  },
});
</script>
