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
      v-model="editedStep.column_to_pivot"
      name="Pivot column..."
      placeholder="Enter a column"
      data-path=".column_to_pivot"
      :available-variables="availableVariables"
      :variable-delimiters="variableDelimiters"
      :errors="errors"
    />
    <AutocompleteWidget
      class="valueColumnInput"
      v-model="editedStep.value_column"
      name="Use values in..."
      :options="columnNames"
      placeholder="Select a column"
      data-path=".value_column"
      :available-variables="availableVariables"
      :variable-delimiters="variableDelimiters"
      :errors="errors"
    />
    <AutocompleteWidget
      class="aggregationFunctionInput"
      v-model="editedStep.agg_function"
      name="Aggregate values using..."
      :options="aggregationFunctions"
      placeholder="Aggregation function"
      data-path=".agg_function"
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
import MultiselectWidget from '@/components/stepforms/widgets/Multiselect.vue';
import { PipelineStepName, PivotStep } from '@/lib/steps';
import { VariableDelimiters, VariablesBucket } from '@/lib/variables';
import { VQBModule } from '@/store';

import BaseStepForm from './StepForm.vue';

@Component({
  name: 'pivot-step-form',
  components: {
    ColumnPicker,
    AutocompleteWidget,
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
      column_to_pivot: '',
      value_column: '',
      agg_function: 'sum',
    }),
  })
  initialStepValue!: PivotStep;

  readonly title: string = 'Pivot column';
  aggregationFunctions: PivotStep['agg_function'][] = ['sum', 'avg', 'count', 'min', 'max'];

  get stepSelectedColumn() {
    return this.editedStep.column_to_pivot;
  }

  set stepSelectedColumn(colname: string | null) {
    if (colname === null) {
      throw new Error('should not try to set null on percentage "value column" field');
    }
    if (colname !== null) {
      this.editedStep.column_to_pivot = colname;
    }
  }

  validate() {
    const errors = this.$$super.validate();
    if (errors !== null) {
      return errors;
    }
    if (
      this.editedStep.column_to_pivot === this.editedStep.value_column ||
      this.editedStep.index.includes(this.editedStep.column_to_pivot)
    ) {
      return [
        {
          params: [],
          schemaPath: '.column_to_pivot',
          keyword: 'columnNameConflict',
          dataPath: '.column_to_pivot',
          message: `Column name ${this.editedStep.column_to_pivot} is used at least twice but should be unique`,
        },
      ];
    } else if (this.editedStep.index.includes(this.editedStep.value_column)) {
      return [
        {
          params: [],
          schemaPath: '.value_column',
          keyword: 'columnNameConflict',
          dataPath: '.value_column',
          message: `Column name ${this.editedStep.value_column} is used at least twice but should be unique`,
        },
      ];
    }
    return null;
  }
}
</script>
