<template>
  <div>
    <StepFormHeader :title="title" :stepName="this.editedStep.name" />
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
      name="(Optional) Index columns (labels):"
      :options="columnNames"
      placeholder="Add columns"
      data-path=".indexColumns"
      :errors="errors"
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
import { Prop } from 'vue-property-decorator';

import { StepFormComponent } from '@/components/formlib';
import ColumnPicker from '@/components/stepforms/ColumnPicker.vue';
import AutocompleteWidget from '@/components/stepforms/widgets/Autocomplete.vue';
import InputTextWidget from '@/components/stepforms/widgets/InputText.vue';
import MultiselectWidget from '@/components/stepforms/widgets/Multiselect.vue';
import { EvolutionStep } from '@/lib/steps';

import BaseStepForm from './StepForm.vue';

type EvolutionFormat = {
  evolutionFormat: 'abs' | 'pct';
  label: string;
};

type EvolutionType = {
  evolutionType: 'vsLastYear' | 'vsLastMonth' | 'vsLastWeek' | 'vsLastDay';
  label: string;
};

@StepFormComponent({
  vqbstep: 'evolution',
  name: 'evolution-step-form',
  components: {
    ColumnPicker,
    AutocompleteWidget,
    InputTextWidget,
    MultiselectWidget,
  },
})
export default class EvolutionStepForm extends BaseStepForm<EvolutionStep> {
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
