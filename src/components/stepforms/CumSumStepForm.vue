<template>
  <div>
    <StepFormHeader :title="title" :stepName="editedStep.name" :version="version" />
    <ColumnPicker
      class="valueColumnInput"
      v-model="editedStep.valueColumn"
      name="Value column to sum"
      placeholder="Enter a column"
      data-path=".valueColumn"
      :syncWithSelectedColumn="false"
      :errors="errors"
      :available-variables="availableVariables"
      :variable-delimiters="variableDelimiters"
    />
    <ColumnPicker
      class="referenceColumnInput"
      v-model="editedStep.referenceColumn"
      name="Reference column to sort (usually dates)"
      placeholder="Enter a column"
      data-path=".referenceColumn"
      :syncWithSelectedColumn="false"
      :errors="errors"
    />
    <MultiselectWidget
      class="groupbyInput"
      v-model="editedStep.groupby"
      name="(Optional) Group cumulated sum by:"
      :options="columnNames"
      placeholder="Add columns"
      data-path=".groupby"
      :errors="errors"
      :available-variables="availableVariables"
      :variable-delimiters="variableDelimiters"
    />
    <InputTextWidget
      class="newColumnInput"
      v-model="editedStep.newColumn"
      name="(Optional) New column name:"
      :placeholder="`${editedStep.valueColumn}_CUMSUM`"
      data-path=".newColumn"
      :errors="errors"
    />
    <StepFormButtonbar />
  </div>
</template>

<script lang="ts">
import Component from 'vue-class-component';
import { Prop } from 'vue-property-decorator';

import InputTextWidget from '@/components/stepforms/widgets/InputText.vue';
import { CumSumStep, PipelineStepName } from '@/lib/steps';
import { VariableDelimiters, VariablesBucket } from '@/lib/variables';
import { VQBModule } from '@/store';

import ColumnPicker from './ColumnPicker.vue';
import BaseStepForm from './StepForm.vue';
import ListWidget from './widgets/List.vue';
import MultiselectWidget from './widgets/Multiselect.vue';

@Component({
  name: 'cumsum-step-form',
  components: {
    ColumnPicker,
    InputTextWidget,
    ListWidget,
    MultiselectWidget,
  },
})
export default class CumSumStepForm extends BaseStepForm<CumSumStep> {
  stepname: PipelineStepName = 'cumsum';

  @VQBModule.State availableVariables?: VariablesBucket;

  @VQBModule.State variableDelimiters?: VariableDelimiters;

  @Prop({ type: Object, default: () => ({ name: 'cumsum', valueColumn: '', referenceColumn: '' }) })
  initialStepValue!: CumSumStep;

  readonly title: string = 'Compute cumulated sum';
}
</script>
