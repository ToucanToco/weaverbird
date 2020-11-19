<template>
  <div>
    <StepFormHeader :title="title" :stepName="editedStep.name" :version="version" />
    <ColumnPicker
      class="column"
      v-model="editedStep.column"
      name="Column to work on:"
      :options="columnNames"
      placeholder="Pick a column"
      data-path=".column"
      :errors="errors"
    />
    <AutocompleteWidget
      name="Property to extract"
      class="operation"
      :options="operations"
      :value="currentOperation"
      @input="updateCurrentOperation"
      placeholder="Extract operations"
      :trackBy="`operation`"
      :label="`label`"
      data-path=".operation"
      :errors="errors"
    />
    <InputTextWidget
      class="newColumnName"
      v-model="editedStep.new_column_name"
      name="New column name:"
      :placeholder="newColumnNamePlaceholder"
      data-path=".new_column_name"
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
import InputTextWidget from '@/components/stepforms/widgets/InputText.vue';
import { generateNewColumnName } from '@/lib/helpers';
import { DateExtractPropertyStep, PipelineStepName } from '@/lib/steps';

import BaseStepForm from './StepForm.vue';

type OperationOption = {
  operation: DateExtractPropertyStep['operation'];
  label: string;
};

@Component({
  name: 'dateextract-step-form',
  components: {
    AutocompleteWidget,
    ColumnPicker,
    InputTextWidget,
  },
})
export default class DateExtractStepForm extends BaseStepForm<DateExtractPropertyStep> {
  stepname: PipelineStepName = 'dateextract';

  @Prop({ type: Object, default: () => ({ name: 'dateextract', column: '' }) })
  initialStepValue!: DateExtractPropertyStep;

  readonly title: string = 'Convert Column From Text to Date';

  readonly operations: OperationOption[] = [
    { operation: 'year', label: 'year' },
    { operation: 'month', label: 'month' },
    { operation: 'day', label: 'day of month' },
    { operation: 'hour', label: 'hour' },
    { operation: 'minutes', label: 'minutes' },
    { operation: 'seconds', label: 'seconds' },
    { operation: 'milliseconds', label: 'milliseconds' },
    { operation: 'dayOfYear', label: 'day of year' },
    { operation: 'dayOfWeek', label: 'day of week' },
    { operation: 'week', label: 'week number' },
  ];

  get defaultNewColumnName() {
    const currentColname = this.editedStep.column ?? '<date-column-name>';
    return `${currentColname}_${this.editedStep.operation}`;
  }

  get newColumnNamePlaceholder() {
    return `Enter a column name (default is ${this.defaultNewColumnName})`;
  }

  get currentOperation(): OperationOption | null {
    if (this.editedStep.operation) {
      return this.operations.filter(d => d.operation === this.editedStep.operation)[0];
    }
    return null;
  }

  updateCurrentOperation(op: OperationOption) {
    this.editedStep.operation = op.operation;
  }

  get stepSelectedColumn() {
    return this.editedStep.column;
  }

  set stepSelectedColumn(colname: string | null) {
    if (colname === null) {
      throw new Error('should not try to set null on "column" field');
    }
    this.editedStep.column = colname;
  }

  submit() {
    // make sure new_column_name doesn't overwrite an existing columm name
    this.editedStep.new_column_name = generateNewColumnName(
      this.editedStep.new_column_name ?? this.defaultNewColumnName,
      this.columnNames,
    );
    this.$$super.submit();
  }
}
</script>
