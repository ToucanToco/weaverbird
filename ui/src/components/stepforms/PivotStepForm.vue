<template>
  <div>
    <StepFormHeader
      :title="title"
      :stepName="editedStep.name"
      :version="version"
      :backendError="backendError"
    />
    <MultiselectWidget
      class="indexInput"
      v-model="editedStep.index"
      name="Keep columns..."
      :options="columnNames"
      placeholder="Add columns"
      data-path=".index"
      :available-variables="availableVariables"
      :variable-delimiters="variableDelimiters"
      :errors="errors"
    />
    <ColumnPicker
      class="columnToPivotInput"
      v-model="editedStep.columnToPivot"
      name="Pivot column..."
      placeholder="Enter a column"
      data-path=".columnToPivot"
      :available-variables="availableVariables"
      :variable-delimiters="variableDelimiters"
      :errors="errors"
    />
    <AutocompleteWidget
      class="valueColumnInput"
      v-model="editedStep.valueColumn"
      name="Use values in..."
      :options="columnNames"
      placeholder="Select a column"
      data-path=".valueColumn"
      :available-variables="availableVariables"
      :variable-delimiters="variableDelimiters"
      :errors="errors"
    />
    <AutocompleteWidget
      class="aggregationFunctionInput"
      v-model="editedStep.aggFunction"
      name="Aggregate values using..."
      :options="aggregationFunctions"
      placeholder="Aggregation function"
      data-path=".aggFunction"
      :errors="errors"
    />
    <StepFormButtonbar />
  </div>
</template>
<script lang="ts">
import Component from 'vue-class-component';
import { Prop } from 'vue-property-decorator';

import ColumnPicker from '@/components/stepforms/ColumnPicker.vue';
import AutocompleteWidget from '@/components/stepforms/widgets/Autocomplete.vue';
import MultiInputTextWidget from '@/components/stepforms/widgets/MultiInputText.vue';
import MultiselectWidget from '@/components/stepforms/widgets/Multiselect.vue';
import type { PipelineStepName, PivotStep } from '@/lib/steps';
import type { VariableDelimiters, VariablesBucket } from '@/lib/variables';
import { VQBModule } from '@/store';

import BaseStepForm from './StepForm.vue';

@Component({
  name: 'pivot-step-form',
  components: {
    ColumnPicker,
    AutocompleteWidget,
    MultiInputTextWidget,
    MultiselectWidget,
  },
})
export default class PivotStepForm extends BaseStepForm<PivotStep> {
  stepname: PipelineStepName = 'pivot';

  @VQBModule.State availableVariables?: VariablesBucket;

  @VQBModule.State variableDelimiters?: VariableDelimiters;

  @Prop({
    type: Object,
    default: () => ({
      name: 'pivot',
      index: [],
      columnToPivot: '',
      valueColumn: '',
      aggFunction: 'sum',
    }),
  })
  declare initialStepValue: PivotStep;

  readonly title: string = 'Pivot column';
  aggregationFunctions: PivotStep['aggFunction'][] = ['sum', 'avg', 'count', 'min', 'max'];

  get stepSelectedColumn() {
    return this.editedStep.columnToPivot;
  }

  set stepSelectedColumn(colname: string | null) {
    if (colname === null) {
      throw new Error('should not try to set null on percentage "value column" field');
    }
    if (colname !== null) {
      this.editedStep.columnToPivot = colname;
    }
  }

  validate() {
    const errors = this.$$super.validate();
    if (errors !== null) {
      return errors;
    }
    if (
      this.editedStep.columnToPivot === this.editedStep.valueColumn ||
      this.editedStep.index.includes(this.editedStep.columnToPivot)
    ) {
      return [
        {
          params: [],
          schemaPath: '.columnToPivot',
          keyword: 'columnNameConflict',
          dataPath: '.columnToPivot',
          message: `Column name ${this.editedStep.columnToPivot} is used at least twice but should be unique`,
        },
      ];
    } else if (this.editedStep.index.includes(this.editedStep.valueColumn)) {
      return [
        {
          params: [],
          schemaPath: '.valueColumn',
          keyword: 'columnNameConflict',
          dataPath: '.valueColumn',
          message: `Column name ${this.editedStep.valueColumn} is used at least twice but should be unique`,
        },
      ];
    }
    return null;
  }
}
</script>
