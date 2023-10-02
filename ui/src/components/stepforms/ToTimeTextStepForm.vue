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
      name="Column to convert:"
      :options="columnNames"
      placeholder="Add column"
      data-path=".column"
      :errors="errors"
    />
    <!-- Format options are not supported in Mongo 3.6 -->
    <AutocompleteWidget
      v-if="translator !== 'mongo36'"
      name="Time format:"
      class="format"
      :value="selectedFormat"
      @input="updateStepFormat"
      :options="formatOptions"
      placeholder="Time format"
      :trackBy="`format`"
      :label="`label`"
      :withExample="true"
    />
    <InputTextWidget
      v-if="translator !== 'mongo36' && useCustomFormat"
      class="customFormat"
      :value="editedStep.format"
      @input="updateCustomFormat"
      name="Custom time format:"
      :placeholder="`Enter a ${translators.find((t) => t.id === translator).label} time format`"
      data-path=".format"
      :errors="errors"
      :docUrl="translators.find((t) => t.id === translator).doc"
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
import type { PipelineStepName, ToTimeTextStep } from '@/lib/steps';
import { VQBModule } from '@/store';
import { State } from 'pinia-class';

import BaseStepForm from './StepForm.vue';

type FormatOption = {
  format: string;
  label: string;
  example: string;
};

@Component({
  name: 'totimetext-step-form',
  components: {
    AutocompleteWidget,
    ColumnPicker,
    InputTextWidget,
  },
})
export default class ToTimeTextStepForm extends BaseStepForm<ToTimeTextStep> {
  stepname: PipelineStepName = 'totimetext';

  @Prop({ type: Object, default: () => ({ name: 'totimetext', column: '', format: undefined }) })
  declare initialStepValue: ToTimeTextStep;

  @State(VQBModule) translator!: string;

  readonly title: string = 'Convert Column From Text to Time';
  readonly formatOptions: FormatOption[] = [
    { format: 'custom', label: 'Custom', example: '' },
    { format: '%H:%M:%S', label: '%H:%M:%S', example: '19:53:14' },
    { format: '%M:%S', label: '%M:%S', example: '53:14' },
    { format: '%Mm%Ss', label: '%Mm%Ss', example: '53m14s' },
    { format: '%H:%M', label: '%H:%M', example: '19:53' },
    { format: '%Hh%M', label: '%Hh%M', example: '19h53' },
  ];
  readonly timePresets = this.formatOptions
    .filter((d) => d.format !== 'custom')
    .map((d) => d.format);
  readonly translators = [
    {
      id: 'mongo36',
      label: 'Mongo 3.6',
      doc: 'https://docs.mongodb.com/manual/reference/operator/aggregation/dateFromString/index.html#datefromstring-format-specifiers',
    },
    {
      id: 'mongo40',
      label: 'Mongo 4.0',
      doc: 'https://docs.mongodb.com/manual/reference/operator/aggregation/dateFromString/index.html#datefromstring-format-specifiers',
    },
    {
      id: 'mongo42',
      label: 'Mongo 4.2',
      doc: 'https://docs.mongodb.com/manual/reference/operator/aggregation/dateFromString/index.html#datefromstring-format-specifiers',
    },
    {
      id: 'mongo50',
      label: 'Mongo 5.0',
      doc: 'https://docs.mongodb.com/manual/reference/operator/aggregation/dateFromString/index.html#datefromstring-format-specifiers',
    },
    {
      id: 'pandas',
      label: 'Pandas',
      doc: 'https://docs.python.org/3/library/datetime.html#strftime-and-strptime-format-codes',
    },
    {
      id: 'pandas-no_joins',
      label: 'Pandas',
      doc: 'https://docs.python.org/3/library/datetime.html#strftime-and-strptime-format-codes',
    },
    {
      id: 'athena',
      label: 'AWS Athena',
      doc: 'https://prestodb.io/docs/current/functions/datetime.html#mysql-date-functions',
    },
    {
      id: 'google-big-query',
      label: 'Google Big Query',
      doc: 'https://cloud.google.com/bigquery/docs/reference/standard-sql/format-elements#format_elements_date_time',
    },
    {
      id: 'mysql',
      label: 'MySQL',
      doc: 'https://dev.mysql.com/doc/refman/8.0/en/date-and-time-functions.html#function_date-format',
    },
    {
      id: 'postgresql',
      label: 'PostgresSQL',
      doc: 'https://www.postgresql.org/docs/8.2/functions-formatting.html#FUNCTIONS-FORMATTING-DATETIME-TABLE',
    },
    {
      id: 'redshift',
      label: 'AWS Redshift',
      doc: 'https://docs.aws.amazon.com/redshift/latest/dg/r_FORMAT_strings.html',
    },
    {
      id: 'snowflake',
      label: 'Snowflake',
      doc: 'https://docs.snowflake.com/en/sql-reference/functions-conversion.html#date-and-time-formats-in-conversion-functions',
    },
  ];

  selectedFormat: FormatOption = this.formatOptions[0];

  get stepSelectedColumn() {
    return this.editedStep.column;
  }

  set stepSelectedColumn(colname: string | null) {
    if (colname === null) {
      throw new Error('should not try to set null on "column" field');
    }
    this.editedStep.column = colname;
  }
  get useCustomFormat(): boolean {
    return this.selectedFormat.format === 'custom';
  }

  created() {
    this.selectedFormat = this.getSelectedFormat();
  }

  getSelectedFormat(): FormatOption {
    if (this.editedStep.format && this.timePresets.includes(this.editedStep.format)) {
      return this.formatOptions.filter((d) => d.format === this.editedStep.format)[0];
    }
    return this.formatOptions.filter((d) => d.format !== 'custom')[0];
  }

  updateStepFormat(newFormat: FormatOption) {
    if (newFormat.format === 'custom') {
      this.editedStep.format = '';
    } else {
      this.editedStep.format = newFormat.format;
    }
    this.selectedFormat = newFormat;
  }

  updateCustomFormat(format: string | undefined) {
    // input text return undefined when user delete field content, we need an empty string to display custom format error
    this.editedStep.format = format ?? '';
  }
}
</script>
