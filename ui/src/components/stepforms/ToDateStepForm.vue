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
      :columnNames="columnNames"
      :selectedColumns="selectedColumns"
      @setSelectedColumns="setSelectedColumns"
    />
    <!-- Format options are not supported in Mongo 3.6 -->
    <AutocompleteWidget
      v-if="translator !== 'mongo36'"
      name="Date format:"
      class="format"
      :value="selectedFormat"
      @input="updateStepFormat"
      :options="formatOptions"
      placeholder="Date format"
      :trackBy="`format`"
      :label="`label`"
      :withExample="true"
    />
    <InputTextWidget
      v-if="translator !== 'mongo36' && useCustomFormat"
      class="customFormat"
      :value="editedStep.format"
      @input="updateCustomFormat"
      name="Custom date format:"
      :placeholder="`Enter a ${translators.find((t) => t.id === translator).label} date format`"
      data-path=".format"
      :errors="errors"
      :docUrl="translators.find((t) => t.id === translator).doc"
    />
    <StepFormButtonbar />
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';

import BaseStepForm from './StepForm.vue';
import ColumnPicker from '@/components/stepforms/ColumnPicker.vue';
import AutocompleteWidget from '@/components/stepforms/widgets/Autocomplete.vue';
import InputTextWidget from '@/components/stepforms/widgets/InputText.vue';
import type { PipelineStepName, ToDateStep } from '@/lib/steps';

type FormatOption = {
  format?: string;
  label: string;
  example: string;
};

export default defineComponent({
  name: 'todate-step-form',
  components: {
    AutocompleteWidget,
    ColumnPicker,
    InputTextWidget,
  },
  extends: BaseStepForm,
  props: {
    initialStepValue: {
      type: Object as PropType<ToDateStep>,
      default: () => ({ name: 'todate', column: '', format: undefined }),
    },
  },
  data() {
    const formatOptions: FormatOption[] = [
      { format: 'guess', label: 'Try to guess', example: '' },
      { format: 'custom', label: 'Custom', example: '' },
      { format: '%Y-%m-%d', label: '%Y-%m-%d', example: '1970-12-31' },
      { format: '%Y/%m/%d', label: '%Y/%m/%d', example: '1970/12/31' },
      { format: '%d-%m-%Y', label: '%d-%m-%Y', example: '31-12-1970' },
      { format: '%d/%m/%Y', label: '%d/%m/%Y', example: '31/12/1970' },
      { format: '%d %b %Y', label: '%d %b %Y', example: '31 Dec 1970' },
      { format: '%d-%b-%Y', label: '%d-%b-%Y', example: '31-Dec-1970' },
      { format: '%d %B %Y', label: '%d %B %Y', example: '31 December 1970' },
      { format: '%b %Y', label: '%b %Y', example: 'Dec 1970' },
      { format: '%b-%Y', label: '%b-%Y', example: 'Dec-1970' },
      { format: '%B %Y', label: '%B %Y', example: 'December 1970' },
      { format: '%Y-%m', label: '%Y-%m', example: '1970-12' },
      { format: '%Y/%m', label: '%Y/%m', example: '1970/12' },
      { format: '%m-%Y', label: '%m-%Y', example: '12-1970' },
      { format: '%m/%Y', label: '%m/%Y', example: '12/1970' },
      { format: '%Y', label: '%Y', example: '1970' },
    ];

    const datePresets = formatOptions
      .filter((d) => d.format !== 'guess' && d.format !== 'custom')
      .map((d) => d.format);

    const translators = [
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

    return {
      stepname: 'todate' as PipelineStepName,
      title: 'Convert Column From Text to Date' as string,
      formatOptions,
      datePresets,
      translators,
      selectedFormat: formatOptions[0],
      editedStep: {
        ...this.initialStepValue,
        ...this.stepFormDefaults,
      },
    };
  },
  computed: {
    stepSelectedColumn: {
      get() {
        return this.editedStep.column;
      },
      set(colname: string | null) {
        if (colname === null) {
          throw new Error('should not try to set null on "column" field');
        }
        this.editedStep.column = colname;
      },
    },
    useCustomFormat(): boolean {
      return this.selectedFormat.format === 'custom';
    },
  },
  created() {
    this.selectedFormat = this.getSelectedFormat();
  },
  methods: {
    getSelectedFormat(): FormatOption {
      if (this.editedStep.format === undefined) {
        return this.formatOptions.filter((d) => d.format === 'guess')[0];
      }
      if (this.datePresets.includes(this.editedStep.format)) {
        return this.formatOptions.filter((d) => d.format === this.editedStep.format)[0];
      }
      return this.formatOptions.filter((d) => d.format === 'custom')[0];
    },
    updateStepFormat(newFormat: FormatOption) {
      if (newFormat.format === 'guess') {
        this.editedStep.format = undefined;
      } else if (newFormat.format === 'custom') {
        this.editedStep.format = '';
      } else {
        this.editedStep.format = newFormat.format;
      }
      this.selectedFormat = newFormat;
    },
    updateCustomFormat(format: string | undefined) {
      // input text return undefined when user delete field content, we need an empty string to display custom format error
      this.editedStep.format = format ?? '';
    },
  },
});
</script>
