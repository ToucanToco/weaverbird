<template>
  <div>
    <StepFormHeader
      :title="title"
      :stepName="editedStep.name"
      :version="version"
      :backendError="backendError"
    />
    <MultiselectWidget
      class="columnsInput"
      v-model="editedStep.columns"
      name="Convert columns:"
      :options="columnNames"
      @input="setSelectedColumns({ column: editedStep.columns[editedStep.columns.length - 1] })"
      placeholder="Select column(s)"
      data-path=".columns"
      :errors="errors"
      :allowCustom="true"
    />
    <AutocompleteWidget
      class="typeInput"
      name="To data type:"
      v-model="editedStep.dataType"
      :options="dataTypes"
      placeholder="Select a data type"
      data-path=".dataType"
      :errors="errors"
    />
    <StepFormButtonbar />
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';

import type { ConvertStep, PipelineStepName } from '@/lib/steps';
import AutocompleteWidget from '@/components/stepforms/widgets/Autocomplete.vue';
import MultiselectWidget from '@/components/stepforms/widgets/Multiselect.vue';
import BaseStepForm from './StepForm.vue';

type DataType = 'integer' | 'float' | 'text' | 'date' | 'boolean';

export default defineComponent({
  name: 'convert-step-form',
  components: {
    AutocompleteWidget,
    MultiselectWidget,
  },
  extends: BaseStepForm,
  props: {
    initialStepValue: {
      type: Object as PropType<ConvertStep>,
      default: () => ({
        name: 'convert',
        columns: [],
        dataType: ''
      }),
    },
  },
  data(): {
    stepname: PipelineStepName;
    title: string;
    dataTypes: DataType[];
    editedStep: ConvertStep;
  } {
    return {
      stepname: 'convert',
      title: 'Convert Columns Data Types',
      dataTypes: ['integer', 'float', 'text', 'date', 'boolean'],
      editedStep: {
        ...this.initialStepValue,
        ...this.stepFormDefaults,
      },
    };
  },
});
</script>
