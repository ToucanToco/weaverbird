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
      placeholder="Add columns"
      data-path=".column"
      :errors="errors"
    />
    <AutocompleteWidget
      name="Duration format:"
      class="format"
      :value="selectedFormat"
      @input="updateStepFormat"
      :options="formatOptions"
      placeholder="Duration format"
      :trackBy="`format`"
      :label="`label`"
      :withExample="true"
    />
    <InputTextWidget
      v-if="useCustomFormat"
      class="customFormat"
      :value="editedStep.format"
      @input="updateCustomFormat"
      name="Custom duration format:"
      :placeholder="`Enter a ${translators.find((t) => t.id === translator).label} duration format`"
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
import type { PropOptions } from 'vue';

import ColumnPicker from '@/components/stepforms/ColumnPicker.vue';
import AutocompleteWidget from '@/components/stepforms/widgets/Autocomplete.vue';
import InputTextWidget from '@/components/stepforms/widgets/InputText.vue';
import type { FromDurationStep, PipelineStepName } from '@/lib/steps';
import { VQBModule } from '@/store';
import { State } from 'pinia-class';

import BaseStepForm from './StepForm.vue';

type FormatOption = {
  format: string;
  label: string;
  example: string;
};

@Component({
  name: 'fromduration-step-form',
  components: {
    AutocompleteWidget,
    ColumnPicker,
    InputTextWidget,
  },
})
export default class FromDurationStepForm extends BaseStepForm<FromDurationStep> {
  stepname: PipelineStepName = 'fromduration';

  @Prop({ type: Object, default: () => ({ name: 'fromduration', column: '', format: '%H:%M:%S' }) } as PropOptions<FromDurationStep>)
  declare initialStepValue: FromDurationStep;

  @State(VQBModule) translator!: string;

  readonly title: string = 'Convert Column From Date to Text';
  readonly formatOptions: FormatOption[] = [
    { format: 'custom', label: 'Custom', example: '' },
    { format: '%H:%M:%S', label: '%H:%M:%S', example: '19:53:14' },
    { format: '%H:%M:%S.%f', label: '%H:%M:%S.%f', example: '19:53:14.123456' },
    { format: '%M:%S', label: '%M:%S', example: '53:14' },
    { format: '%Mm%Ss', label: '%Mm%Ss', example: '53m14s' },
    { format: '%H:%M', label: '%H:%M', example: '19:53' },
    { format: '%Hh%M', label: '%Hh%M', example: '19h53' },
  ];
  readonly datePresets = this.formatOptions
    .filter((d) => d.format !== 'custom')
    .map((d) => d.format);
  readonly translators = [
    {
      id: 'mongo36',
      label: 'Mongo 3.6',
      doc: 'https://docs.mongodb.com/manual/reference/operator/aggregation/dateToString/#format-specifiers',
    },
    {
      id: 'mongo40',
      label: 'Mongo 4.0',
      doc: 'https://docs.mongodb.com/manual/reference/operator/aggregation/dateToString/#format-specifiers',
    },
    {
      id: 'mongo42',
      label: 'Mongo 4.2',
      doc: 'https://docs.mongodb.com/manual/reference/operator/aggregation/dateToString/#format-specifiers',
    },
    {
      id: 'mongo50',
      label: 'Mongo 5.0',
      doc: 'https://docs.mongodb.com/manual/reference/operator/aggregation/dateToString/#format-specifiers',
    },
    {
      id: 'pandas',
      label: 'Pandas',
      doc: 'https://docs.python.org/3/library/dateduration.html#strfduration-and-strpduration-format-codes',
    },
    {
      id: 'pandas-no_joins',
      label: 'Pandas',
      doc: 'https://docs.python.org/3/library/dateduration.html#strfduration-and-strpduration-format-codes',
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
    if (this.datePresets.includes(this.editedStep.format)) {
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
