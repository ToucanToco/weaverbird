<template>
  <div>
    <StepFormHeader :title="title" :stepName="editedStep.name" :version="version" />
    <ColumnPicker
      class="dateColumnInput"
      v-model="editedStep.dateCol"
      name="Date column:"
      placeholder="Enter a column"
      data-path=".dateCol"
      :syncWithSelectedColumn="false"
      :errors="errors"
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
import Component from 'vue-class-component';
import { Prop } from 'vue-property-decorator';

import { EvolutionStep, PipelineStepName } from '../../lib/steps';
import { VariableDelimiters, VariablesBucket } from '../../lib/variables';
import { VQBModule } from '../../store';
import ColumnPicker from '..//stepforms/ColumnPicker.vue';
import AutocompleteWidget from '..//stepforms/widgets/Autocomplete.vue';
import InputTextWidget from '..//stepforms/widgets/InputText.vue';
import MultiselectWidget from '..//stepforms/widgets/Multiselect.vue';
import BaseStepForm from './StepForm.vue';

type EvolutionFormat = {
  evolutionFormat: 'abs' | 'pct';
  label: string;
};

type EvolutionType = {
  evolutionType: 'vsLastYear' | 'vsLastMonth' | 'vsLastWeek' | 'vsLastDay';
  label: string;
};

@Component({
  name: 'evolution-step-form',
  components: {
    ColumnPicker,
    AutocompleteWidget,
    InputTextWidget,
    MultiselectWidget,
  },
})
export default class EvolutionStepForm extends BaseStepForm<EvolutionStep> {
  stepname: PipelineStepName = 'evolution';

  @VQBModule.State availableVariables?: VariablesBucket;

  @VQBModule.State variableDelimiters?: VariableDelimiters;

  @Prop({
    type: Object,
    default: () => ({
      name: 'evolution',
      dateCol: '',
      valueCol: '',
      evolutionType: 'vsLastYear',
      evolutionFormat: 'abs',
      indexColumns: [],
    }),
  })
  initialStepValue!: EvolutionStep;

  readonly title: string = 'Compute evolution';
  readonly evolutionFormats: EvolutionFormat[] = [
    { evolutionFormat: 'abs', label: 'absolute value' },
    { evolutionFormat: 'pct', label: 'percentage' },
  ];
  readonly evolutionTypes: EvolutionType[] = [
    { evolutionType: 'vsLastYear', label: 'last year' },
    { evolutionType: 'vsLastMonth', label: 'last month' },
    { evolutionType: 'vsLastWeek', label: 'last week' },
    { evolutionType: 'vsLastDay', label: 'last day' },
  ];

  get evolutionFormat(): EvolutionFormat {
    return this.evolutionFormats.filter(
      d => d.evolutionFormat === this.editedStep.evolutionFormat,
    )[0];
  }

  set evolutionFormat(input: EvolutionFormat) {
    this.editedStep.evolutionFormat = input.evolutionFormat;
  }

  get evolutionType(): EvolutionType {
    return this.evolutionTypes.filter(d => d.evolutionType === this.editedStep.evolutionType)[0];
  }

  set evolutionType(input: EvolutionType) {
    this.editedStep.evolutionType = input.evolutionType;
  }
}
</script>
