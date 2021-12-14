<template>
  <div>
    <StepFormHeader
      :title="title"
      :stepName="editedStep.name"
      :version="version"
      :backendError="backendError"
    />
    <ListWidget
      addFieldName="Add column"
      class="toReplace"
      name="Columns to cumulate :"
      v-model="toCumSum"
      :defaultItem="['', '']"
      :widget="cumSumWidget"
      :automatic-new-field="false"
      data-path=".toCumSum"
      :errors="errors"
      :available-variables="availableVariables"
      :variable-delimiters="variableDelimiters"
      unstyled-items
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
import CumSumWidget from './widgets/CumSum.vue';
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

  @Prop({
    type: Object,
    default: () => ({ name: 'cumsum', toCumSum: [['', '']], referenceColumn: '' }),
  })
  initialStepValue!: CumSumStep;

  readonly title: string = 'Compute cumulated sum';
  cumSumWidget = CumSumWidget;

  /** Overload the definition of editedStep in BaseStepForm to guarantee retrocompatibility,
   *  as we have to manage historical configurations where only one column at a time could be
   * renamed via the 'valueColumn' and 'newColumn' parameter, now optional and not useful. So we
   * convert them into a 'toCumSum' array upfront */
  editedStep = {
    ...this.stepFormDefaults,
    ...this.initialStepValue,
    toCumSum:
      this.initialStepValue.valueColumn && this.initialStepValue.newColumn
        ? [[this.initialStepValue.valueColumn, this.initialStepValue.newColumn]]
        : this.initialStepValue.toCumSum,
    valueColumn: undefined,
    newColumn: undefined,
  };

  get toCumSum() {
    return this.editedStep.toCumSum;
  }

  set toCumSum(newval) {
    this.editedStep.toCumSum = [...newval];
  }
}
</script>
