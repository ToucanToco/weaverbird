<template>
  <div>
    <StepFormHeader
      :title="title"
      :stepName="editedStep.name"
      :version="version"
      :backendError="backendError"
    />
    <ColumnPicker
      class="valueColInput"
      v-model="editedStep.valueCol"
      name="Value column to rank:"
      placeholder="Select a column"
      data-path=".valueCol"
      :syncWithSelectedColumn="false"
      :errors="errors"
      :available-variables="availableVariables"
      :variable-delimiters="variableDelimiters"
      :trusted-variable-delimiters="trustedVariableDelimiters"
      :columnNames="columnNames"
      :selectedColumns="selectedColumns"
      @setSelectedColumns="setSelectedColumns"
    />
    <AutocompleteWidget
      class="orderInput"
      name="Sort order:"
      v-model="editedStep.order"
      :options="['asc', 'desc']"
      data-path=".order"
    />
    <AutocompleteWidget
      class="methodInput"
      name="Ranking method:"
      v-model="editedStep.method"
      :options="['standard', 'dense']"
      data-path=".method"
    />
    <MultiselectWidget
      class="groupbyInput"
      v-model="editedStep.groupby"
      name="(Optional) Group ranking by:"
      :options="columnNames"
      placeholder="Add columns"
      data-path=".groupby"
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
      :placeholder="`${editedStep.valueCol}_RANK`"
      data-path=".newColumnName"
      :errors="errors"
    />
    <StepFormButtonbar />
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';

import AutocompleteWidget from '@/components/stepforms/widgets/Autocomplete.vue';
import InputTextWidget from '@/components/stepforms/widgets/InputText.vue';
import type { PipelineStepName, RankStep } from '@/lib/steps';
import BaseStepForm from './StepForm.vue';
import ColumnPicker from './ColumnPicker.vue';
import MultiselectWidget from './widgets/Multiselect.vue';

export default defineComponent({
  name: 'rank-step-form',
  components: {
    AutocompleteWidget,
    ColumnPicker,
    InputTextWidget,
    MultiselectWidget,
  },
  extends: BaseStepForm,
  props: {
    initialStepValue: {
      type: Object as PropType<Partial<RankStep>>,
      default: (): Partial<RankStep> => ({
        name: 'rank', valueCol: '', order: 'desc', method: 'standard'
      }),
    },
  },
  data() {
    return {
      stepname: 'rank' as PipelineStepName,
      title: 'Compute rank' as string,
    };
  },
});
</script>
