<template>
  <div>
    <StepFormHeader
      :title="title"
      :stepName="editedStep.name"
      :version="version"
      :backendError="backendError"
    />
    <InputTextWidget
      class="limitInput"
      v-model.number="editedStep.limit"
      type="number"
      name="Get top..."
      placeholder="Enter a number of rows"
      data-path=".limit"
      :errors="errors"
    />
    <ColumnPicker
      class="rankOnInput"
      v-model="editedStep.rankOn"
      name="Sort column..."
      placeholder="Enter a column"
      :syncWithSelectedColumn="false"
      data-path=".rankOn"
      :errors="errors"
      :available-variables="availableVariables"
      :variable-delimiters="variableDelimiters"
      :trusted-variable-delimiters="trustedVariableDelimiters"
      :columnNames="columnNames"
      :selectedColumns="selectedColumns"
      @setSelectedColumns="setSelectedColumns"
    />
    <AutocompleteWidget
      class="sortOrderInput"
      v-model="editedStep.sort"
      name="Sort order:"
      :options="['asc', 'desc']"
      placeholder="Select an order"
      data-path=".sort"
      :errors="errors"
    />
    <MultiselectWidget
      class="groupbyColumnsInput"
      v-model="editedStep.groups"
      name="(Optional) Group by..."
      :options="columnNames"
      placeholder="Select columns"
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

import type { PipelineStepName, TopStep } from '@/lib/steps';
import AutocompleteWidget from '@/components/stepforms/widgets/Autocomplete.vue';
import BaseStepForm from './StepForm.vue';
import ColumnPicker from '@/components/stepforms/ColumnPicker.vue';
import InputTextWidget from '@/components/stepforms/widgets/InputText.vue';
import MultiselectWidget from './widgets/Multiselect.vue';

export default defineComponent({
  name: 'top-step-form',
  components: {
    ColumnPicker,
    AutocompleteWidget,
    InputTextWidget,
    MultiselectWidget,
  },
  extends: BaseStepForm,
  props: {
    initialStepValue: {
      type: Object as PropType<TopStep>,
      default: () => ({ name: 'top', rankOn: '', sort: 'desc' }),
    },
  },
  data() {
    return {
      stepname: 'top' as PipelineStepName,
      title: 'Top N rows' as string,
      editedStep: {
        ...this.initialStepValue,
        ...this.stepFormDefaults,
      },
    };
  },
  computed: {
    stepSelectedColumn: {
      get(): string {
        return this.editedStep.rankOn;
      },
      set(colname: string | null) {
        if (colname === null) {
          throw new Error('should not try to set null on top "rankOn" field');
        }
        this.editedStep.rankOn = colname;
      },
    },
  },
});
</script>
