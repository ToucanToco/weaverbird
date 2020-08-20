<template>
  <div>
    <StepFormHeader :title="title" :stepName="this.editedStep.name" />
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
import { Prop } from 'vue-property-decorator';

import { StepFormComponent } from '@/components/formlib';
import AutocompleteWidget from '@/components/stepforms/widgets/Autocomplete.vue';
import InputTextWidget from '@/components/stepforms/widgets/InputText.vue';
import { RankStep } from '@/lib/steps';
import { VariableDelimiters, VariablesBucket } from '@/lib/variables';
import { VQBModule } from '@/store';

import ColumnPicker from './ColumnPicker.vue';
import BaseStepForm from './StepForm.vue';
import MultiselectWidget from './widgets/Multiselect.vue';

@StepFormComponent({
  vqbstep: 'rank',
  name: 'rank-step-form',
  components: {
    AutocompleteWidget,
    ColumnPicker,
    InputTextWidget,
    MultiselectWidget,
  },
})
export default class RankStepForm extends BaseStepForm<RankStep> {
  @VQBModule.State availableVariables!: VariablesBucket;

  @VQBModule.State variableDelimiters!: VariableDelimiters;

  @Prop({
    type: Object,
    default: () => ({ name: 'rank', valueCol: '', order: 'desc', method: 'standard' }),
  })
  initialStepValue!: RankStep;

  readonly title: string = 'Compute rank';
}
</script>
