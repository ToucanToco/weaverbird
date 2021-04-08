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
      name="Value column:"
      placeholder="Select a column"
      :syncWithSelectedColumn="false"
      data-path=".valueColumn"
      :errors="errors"
      :available-variables="availableVariables"
      :variable-delimiters="variableDelimiters"
    />
    <ColumnPicker
      class="columnToSortInput"
      v-model="editedStep.columnToSort"
      name="Reference column to sort (usually dates):"
      placeholder="Select a column"
      :syncWithSelectedColumn="false"
      data-path=".columnToSort"
      :errors="errors"
      :available-variables="availableVariables"
      :variable-delimiters="variableDelimiters"
    />
    <InputTextWidget
      class="movingWindowInput"
      v-model.number="editedStep.movingWindow"
      type="number"
      name="Moving window (in number of rows):"
      placeholder="Enter a number of rows"
      data-path=".limit"
      :errors="movingWindow"
      :available-variables="availableVariables"
      :variable-delimiters="variableDelimiters"
    />
    <MultiselectWidget
      class="groupsInput"
      v-model="editedStep.groups"
      name="(Optional) Group by:"
      :options="columnNames"
      placeholder="Select columns"
      data-path=".groups"
      :errors="errors"
      :available-variables="availableVariables"
      :variable-delimiters="variableDelimiters"
    />
    <InputTextWidget
      class="newColumnNameInput"
      v-model="editedStep.newColumnName"
      name="(Optional) New column name:"
      :placeholder="`${editedStep.valueColumn}_MOVING_AVG`"
      data-path=".newColumnName"
      :errors="errors"
    />
    <StepFormButtonbar />
  </div>
</template>

<script lang="ts">
import Component from 'vue-class-component';
import { Prop } from 'vue-property-decorator';

import ColumnPicker from '@/components/stepforms/ColumnPicker.vue';
import InputTextWidget from '@/components/stepforms/widgets/InputText.vue';
import { MovingAverageStep, PipelineStepName } from '@/lib/steps';
import { VariableDelimiters, VariablesBucket } from '@/lib/variables';
import { VQBModule } from '@/store';

import BaseStepForm from './StepForm.vue';
import MultiselectWidget from './widgets/Multiselect.vue';

@Component({
  name: 'moving-average-step-form',
  components: {
    ColumnPicker,
    InputTextWidget,
    MultiselectWidget,
  },
})
export default class MovingAverageStepForm extends BaseStepForm<MovingAverageStep> {
  stepname: PipelineStepName = 'movingaverage';

  @VQBModule.State availableVariables?: VariablesBucket;

  @VQBModule.State variableDelimiters?: VariableDelimiters;

  @Prop({
    type: Object,
    default: () => ({
      name: 'movingaverage',
      valueColumn: '',
      columnToSort: '',
      movingWindow: null,
    }),
  })
  initialStepValue!: MovingAverageStep;

  readonly title: string = 'Computate Moving Average';
}
</script>
