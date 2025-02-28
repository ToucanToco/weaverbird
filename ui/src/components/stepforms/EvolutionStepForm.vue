<template>
  <div>
    <StepFormHeader
      :title="title"
      :stepName="editedStep.name"
      :version="version"
      :backendError="backendError"
    />
    <ColumnPicker
      class="dateColumnInput"
      v-model="editedStep.dateCol"
      name="Date column:"
      placeholder="Enter a column"
      data-path=".dateCol"
      :syncWithSelectedColumn="false"
      :errors="errors"
      :columnNames="columnNames"
      :selectedColumns="selectedColumns"
      @setSelectedColumns="setSelectedColumns"
    />
    <ColumnPicker
      class="valueColumnInput"
      v-model="editedStep.valueCol"
      name="Value column:"
      placeholder="Enter a column"
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
      class="evolutionType"
      name="Compute evolution versus:"
      v-model="evolutionType"
      :options="evolutionTypes"
      :trackBy="`evolutionType`"
      :label="`label`"
    />
    <AutocompleteWidget
      class="evolutionFormat"
      name="Compute evolution in:"
      v-model="evolutionFormat"
      :options="evolutionFormats"
      :trackBy="`evolutionFormat`"
      :label="`label`"
    />
    <MultiselectWidget
      class="indexColumnsInput"
      v-model="editedStep.indexColumns"
      name="(Optional) Group by:"
      :options="columnNames"
      placeholder="Add columns"
      data-path=".indexColumns"
      :errors="errors"
      :available-variables="availableVariables"
      :variable-delimiters="variableDelimiters"
      :trusted-variable-delimiters="trustedVariableDelimiters"
      :allowCustom="true"
    />
    <InputTextWidget
      class="newColumnInput"
      v-model="editedStep.newColumn"
      name="(Optional) New column name"
      placeholder="Enter a name"
      data-path=".newColumn"
      :errors="errors"
    />
    <StepFormButtonbar />
  </div>
</template>
<script lang="ts">
import { defineComponent, PropType } from 'vue';

import ColumnPicker from '@/components/stepforms/ColumnPicker.vue';
import AutocompleteWidget from '@/components/stepforms/widgets/Autocomplete.vue';
import InputTextWidget from '@/components/stepforms/widgets/InputText.vue';
import MultiselectWidget from '@/components/stepforms/widgets/Multiselect.vue';
import type { EvolutionStep, PipelineStepName } from '@/lib/steps';
import BaseStepForm from './StepForm.vue';

type EvolutionFormat = {
  evolutionFormat: 'abs' | 'pct';
  label: string;
};

type EvolutionType = {
  evolutionType: 'vsLastYear' | 'vsLastMonth' | 'vsLastWeek' | 'vsLastDay';
  label: string;
};

export default defineComponent({
  name: 'evolution-step-form',
  components: {
    ColumnPicker,
    AutocompleteWidget,
    InputTextWidget,
    MultiselectWidget,
  },
  extends: BaseStepForm,
  props: {
    initialStepValue: {
      type: Object as PropType<EvolutionStep>,
      default: (): EvolutionStep => ({
        name: 'evolution',
        dateCol: '',
        valueCol: '',
        evolutionType: 'vsLastYear',
        evolutionFormat: 'abs',
        indexColumns: [],
      }),
    },
  },
  data() {
    return {
      stepname: 'evolution' as PipelineStepName,
      title: 'Compute evolution' as string,
      evolutionFormats: [
        { evolutionFormat: 'abs', label: 'absolute value' },
        { evolutionFormat: 'pct', label: 'percentage' },
      ] as EvolutionFormat[],
      evolutionTypes: [
        { evolutionType: 'vsLastYear', label: 'last year' },
        { evolutionType: 'vsLastMonth', label: 'last month' },
        { evolutionType: 'vsLastWeek', label: 'last week' },
        { evolutionType: 'vsLastDay', label: 'last day' },
      ] as EvolutionType[],
    };
  },
  computed: {
    evolutionFormat: {
      get(): EvolutionFormat {
        return this.evolutionFormats.filter(
          (d) => d.evolutionFormat === this.editedStep.evolutionFormat,
        )[0];
      },
      set(input: EvolutionFormat) {
        this.editedStep.evolutionFormat = input.evolutionFormat;
      },
    },
    evolutionType: {
      get(): EvolutionType {
        return this.evolutionTypes.filter(
          (d) => d.evolutionType === this.editedStep.evolutionType,
        )[0];
      },
      set(input: EvolutionType) {
        this.editedStep.evolutionType = input.evolutionType;
      },
    },
  },
});
</script>
