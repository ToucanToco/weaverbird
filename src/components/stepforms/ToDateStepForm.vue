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
      :placeholder="`Enter a ${translators.find(t => t.id === translator).label} date format`"
      data-path=".format"
      :errors="errors"
      :docUrl="translators.find(t => t.id === translator).doc"
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
import { PipelineStepName, ToDateStep } from '@/lib/steps';
import { VQBModule } from '@/store';

import BaseStepForm from './StepForm.vue';

type FormatOption = {
  format?: string;
  label: string;
  example: string;
};

@Component({
  name: 'todate-step-form',
  components: {
    AutocompleteWidget,
    ColumnPicker,
    InputTextWidget,
  },
})
export default class ToDateStepForm extends BaseStepForm<ToDateStep> {
  stepname: PipelineStepName = 'todate';

  @Prop({ type: Object, default: () => ({ name: 'todate', column: '', format: undefined }) })
  initialStepValue!: ToDateStep;

  @VQBModule.Getter translator!: string;

  readonly title: string = 'Convert Column From Text to Date';
  readonly formatOptions: FormatOption[] = [
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
  readonly datePresets = this.formatOptions
    .filter(d => d.format !== 'guess' && d.format !== 'custom')
    .map(d => d.format);
  readonly translators = [
    {
      id: 'mongo36',
      label: 'Mongo 3.6',
      doc:
        'https://docs.mongodb.com/manual/reference/operator/aggregation/dateFromString/index.html#datefromstring-format-specifiers',
    },
    {
      id: 'mongo40',
      label: 'Mongo 4.0',
      doc:
        'https://docs.mongodb.com/manual/reference/operator/aggregation/dateFromString/index.html#datefromstring-format-specifiers',
    },
    {
      id: 'mongo42',
      label: 'Mongo 4.2',
      doc:
        'https://docs.mongodb.com/manual/reference/operator/aggregation/dateFromString/index.html#datefromstring-format-specifiers',
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
    if (this.editedStep.format === undefined) {
      return this.formatOptions.filter(d => d.format === 'guess')[0];
    }
    if (this.datePresets.includes(this.editedStep.format)) {
      return this.formatOptions.filter(d => d.format === this.editedStep.format)[0];
    }
    return this.formatOptions.filter(d => d.format === 'custom')[0];
  }

  updateStepFormat(newFormat: FormatOption) {
    if (newFormat.format === 'guess') {
      this.editedStep.format = undefined;
    } else if (newFormat.format === 'custom') {
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
