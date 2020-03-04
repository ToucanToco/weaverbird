<template>
  <div>
    <StepFormHeader :title="title" :stepName="this.editedStep.name" />
    <ColumnPicker
      id="valueColumnInput"
      v-model="editedStep.valueColumn"
      name="Value column to sum"
      placeholder="Enter a column"
      data-path=".valueColumn"
      :syncWithSelectedColumn="false"
      :errors="errors"
    />
    <ColumnPicker
      id="referenceColumnInput"
      v-model="editedStep.referenceColumn"
      name="Reference column to sort (usually dates)"
      placeholder="Enter a column"
      data-path=".referenceColumn"
      :syncWithSelectedColumn="false"
      :errors="errors"
    />
    <MultiselectWidget
      id="groupbyInput"
      v-model="editedStep.groupby"
      name="(Optional) Group cumulated sum by:"
      :options="columnNames"
      placeholder="Add columns"
      data-path=".groupby"
      :errors="errors"
    />
    <InputTextWidget
      id="newColumnInput"
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
import { Prop } from 'vue-property-decorator';

import { StepFormComponent } from '@/components/formlib';
import InputTextWidget from '@/components/stepforms/widgets/InputText.vue';
import { CumSumStep } from '@/lib/steps';

import ColumnPicker from './ColumnPicker.vue';
import BaseStepForm from './StepForm.vue';
import ListWidget from './widgets/List.vue';
import MultiselectWidget from './widgets/Multiselect.vue';

@StepFormComponent({
  vqbstep: 'cumsum',
  name: 'cumsum-step-form',
  components: {
    ColumnPicker,
    InputTextWidget,
    ListWidget,
    MultiselectWidget,
  },
})
export default class CumSumStepForm extends BaseStepForm<CumSumStep> {
  @Prop({ type: Object, default: () => ({ name: 'cumsum', valueColumn: '', referenceColumn: '' }) })
  initialStepValue!: CumSumStep;

  readonly title: string = 'Compute cumulated sum';
}
</script>
