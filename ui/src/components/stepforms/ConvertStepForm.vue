<template>
  <div>
    <StepFormHeader
      :title="title"
      :stepName="editedStep.name"
      :version="version"
      :backendError="backendError"
    />
    <MultiselectWidget
      class="columnsInput"
      v-model="editedStep.columns"
      name="Convert columns:"
      :options="columnNames"
      @input="setSelectedColumns({ column: editedStep.columns[editedStep.columns.length - 1] })"
      placeholder="Select column(s)"
      data-path=".columns"
      :errors="errors"
      :allowCustom="true"
    />
    <AutocompleteWidget
      class="typeInput"
      name="To data type:"
      v-model="editedStep.dataType"
      :options="dataTypes"
      placeholder="Select a data type"
      data-path=".dataType"
      :errors="errors"
    />
    <StepFormButtonbar />
  </div>
</template>

<script lang="ts">
import Component from 'vue-class-component';
import { Prop } from 'vue-property-decorator';

import AutocompleteWidget from '@/components/stepforms/widgets/Autocomplete.vue';
import MultiselectWidget from '@/components/stepforms/widgets/Multiselect.vue';
import type { ConvertStep, PipelineStepName } from '@/lib/steps';

import BaseStepForm from './StepForm.vue';

@Component({
  name: 'convert-step-form',
  components: {
    AutocompleteWidget,
    MultiselectWidget,
  },
})
export default class ConvertStepForm extends BaseStepForm<ConvertStep> {
  stepname: PipelineStepName = 'convert';

  @Prop({ type: Object, default: () => ({ name: 'convert', columns: [], dataType: '' }) })
  declare initialStepValue: ConvertStep;

  readonly title: string = 'Convert Columns Data Types';
  dataTypes = ['integer', 'float', 'text', 'date', 'boolean'];
}
</script>
