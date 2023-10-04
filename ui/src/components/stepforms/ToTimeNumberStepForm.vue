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
    <AutocompleteWidget
      name="Time unit:"
      class="unit"
      v-model="editedStep.unit"
      :options="TIME_UNITS"
      placeholder="Time unit"
      data-path=".unit"
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
import { TIME_UNITS, type PipelineStepName, type ToTimeNumberStep } from '@/lib/steps';
import { VQBModule } from '@/store';
import { State } from 'pinia-class';

import BaseStepForm from './StepForm.vue';

@Component({
  name: 'totimenumber-step-form',
  components: {
    AutocompleteWidget,
    ColumnPicker,
    InputTextWidget,
  },
})
export default class ToDateStepForm extends BaseStepForm<ToTimeNumberStep> {
  stepname: PipelineStepName = 'totimenumber';

  @Prop({ type: Object, default: () => ({ name: 'totimenumber', column: '', unit: 'seconds' }) } as PropOptions<ToTimeNumberStep>)
  declare initialStepValue: ToTimeNumberStep;

  @State(VQBModule) translator!: string;

  readonly title: string = 'Convert Column From Number to Time';
  readonly TIME_UNITS = TIME_UNITS;

  get stepSelectedColumn() {
    return this.editedStep.column;
  }

  set stepSelectedColumn(colname: string | null) {
    if (colname === null) {
      throw new Error('should not try to set null on "column" field');
    }
    this.editedStep.column = colname;
  }
}
</script>
