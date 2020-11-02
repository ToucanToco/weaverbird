<template>
  <div>
    <StepFormHeader :title="title" :stepName="editedStep.name" :version="version" />
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
      v-if="editedStep.format !== undefined && !datePresets.includes(editedStep.format)"
      class="customFormat"
      v-model="editedStep.format"
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
import { Prop } from 'vue-property-decorator';

import { StepFormComponent } from '@/components/formlib';
import ColumnPicker from '@/components/stepforms/ColumnPicker.vue';
import AutocompleteWidget from '@/components/stepforms/widgets/Autocomplete.vue';
import InputTextWidget from '@/components/stepforms/widgets/InputText.vue';
import { FromDateStep } from '@/lib/steps';
import { VQBModule } from '@/store';

import BaseStepForm from './StepForm.vue';

type FormatOption = {
  format: string;
  label: string;
  example: string;
};

@StepFormComponent({
  vqbstep: 'fromdate',
  name: 'fromdate-step-form',
  components: {
    AutocompleteWidget,
    ColumnPicker,
    InputTextWidget,
  },
})
export default class FromDateStepForm extends BaseStepForm<FromDateStep> {
  @Prop({ type: Object, default: () => ({ name: 'fromdate', column: '', format: '%Y-%m-%d' }) })
  initialStepValue!: FromDateStep;

  @VQBModule.Getter translator!: string;

  readonly title: string = 'Convert Column From Date to Text';
  readonly formatOptions: FormatOption[] = [
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
  ];
  readonly datePresets = this.formatOptions.filter(d => d.format !== 'custom').map(d => d.format);
  readonly translators = [
    {
      id: 'mongo36',
      label: 'Mongo 3.6',
      doc:
        'https://docs.mongodb.com/manual/reference/operator/aggregation/dateToString/#format-specifiers',
    },
    {
      id: 'mongo40',
      label: 'Mongo 4.0',
      doc:
        'https://docs.mongodb.com/manual/reference/operator/aggregation/dateToString/#format-specifiers',
    },
  ];

  get selectedFormat(): FormatOption {
    if (this.datePresets.includes(this.editedStep.format)) {
      return this.formatOptions.filter(d => d.format === this.editedStep.format)[0];
    }
    return this.formatOptions.filter(d => d.format === 'custom')[0];
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

  updateStepFormat(newFormat: FormatOption) {
    if (newFormat.format === 'custom') {
      this.editedStep.format = '';
    } else {
      this.editedStep.format = newFormat.format;
    }
  }
}
</script>
