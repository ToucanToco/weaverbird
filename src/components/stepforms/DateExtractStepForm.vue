<template>
  <div>
    <StepFormHeader
      :title="title"
      :stepName="editedStep.name"
      :version="version"
      :backendError="backendError"
    />
    <ColumnPicker
      class="column"
      v-model="editedStep.column"
      name="Date column:"
      :options="columnNames"
      placeholder="Pick a column"
      data-path=".column"
      :errors="errors"
    />
    <MultiselectWidget
      class="dateInfoInput"
      name="Date information to extract:"
      :value="currentDateInfo"
      @input="updateCurrentDateInfo"
      :options="dateInfo"
      :trackBy="`info`"
      :label="`label`"
      placeholder="Select one or several"
      data-path=".dateInfo"
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
import MultiselectWidget from '@/components/stepforms/widgets/Multiselect.vue';
import { generateNewColumnName } from '@/lib/helpers';
import { DateExtractStep, DateInfo, PipelineStepName } from '@/lib/steps';

import BaseStepForm from './StepForm.vue';

type DateInfoOption = {
  info: DateInfo;
  label: string;
};

@Component({
  name: 'dateextract-step-form',
  components: {
    ColumnPicker,
    InputTextWidget,
    MultiselectWidget,
  },
})
export default class DateExtractStepForm extends BaseStepForm<DateExtractStep> {
  stepname: PipelineStepName = 'dateextract';

  @Prop({
    type: Object,
    default: () => ({ name: 'dateextract', column: '', dateInfo: [], newColumns: [] }),
  })
  initialStepValue!: DateExtractStep;

  readonly title: string = 'Extract Date Information';

  readonly dateInfo: DateInfoOption[] = [
    { info: 'year', label: 'year' },
    { info: 'month', label: 'month' },
    { info: 'day', label: 'day of month' },
    { info: 'week', label: 'week number' },
    { info: 'quarter', label: 'quarter number' },
    { info: 'dayOfWeek', label: 'day of week' },
    { info: 'dayOfYear', label: 'day of year' },
    { info: 'isoYear', label: 'ISO year' },
    { info: 'isoWeek', label: 'ISO week number' },
    { info: 'isoDayOfWeek', label: 'ISO day of week' },
    { info: 'firstDayOfYear', label: 'first day of year' },
    { info: 'firstDayOfMonth', label: 'first day of month' },
    { info: 'firstDayOfWeek', label: 'first day of week' },
    { info: 'firstDayOfQuarter', label: 'first day of quarter' },
    { info: 'firstDayOfIsoWeek', label: 'first day of ISO week' },
    { info: 'previousDay', label: 'previous day' },
    { info: 'firstDayOfPreviousYear', label: 'first day of previous year' },
    { info: 'firstDayOfPreviousMonth', label: 'first day of previous month' },
    { info: 'firstDayOfPreviousWeek', label: 'first day of previous week' },
    { info: 'firstDayOfPreviousQuarter', label: 'first day of previous quarter' },
    { info: 'firstDayOfPreviousIsoWeek', label: 'first day of previous ISO week' },
    { info: 'previousYear', label: 'previous year number' },
    { info: 'previousMonth', label: 'previous month number' },
    { info: 'previousWeek', label: 'previous week number' },
    { info: 'previousQuarter', label: 'previous quarter number' },
    { info: 'previousIsoWeek', label: 'previous ISO week number' },
    { info: 'hour', label: 'hour' },
    { info: 'minutes', label: 'minutes' },
    { info: 'seconds', label: 'seconds' },
    { info: 'milliseconds', label: 'milliseconds' },
  ];

  /** Overload the definition of editedStep in BaseStepForm to guarantee
   * retrocompatibility with legacy configurations */
  editedStep = {
    ...this.initialStepValue,
    ...this.stepFormDefaults,
    dateInfo: this.initialStepValue.operation
      ? [this.initialStepValue.operation]
      : this.initialStepValue.dateInfo,
    newColumns: this.initialStepValue.new_column_name
      ? [this.initialStepValue.new_column_name]
      : this.initialStepValue.newColumns,
    operation: undefined,
    new_column_name: undefined,
  };

  get currentDateInfo(): DateInfoOption[] {
    return this.dateInfo.filter(d => this.editedStep.dateInfo.includes(d.info));
  }

  updateCurrentDateInfo(options: DateInfoOption[]) {
    this.editedStep.dateInfo = [...options.map(o => o.info)];
  }

  submit() {
    // populate the newColumns field with automatic, safe column names
    this.editedStep.newColumns = this.editedStep.dateInfo.map(d =>
      generateNewColumnName(`${this.editedStep.column}_${d}`, this.columnNames),
    );
    this.$$super.submit();
  }
}
</script>
