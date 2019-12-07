<template>
  <div>
    <step-form-title :title="title" />
    <MultiselectWidget
      id="columnsInput"
      v-model="editedStep.columns"
      name="Convert columns:"
      :options="columnNames"
      @input="setSelectedColumns({ column: editedStep.columns[editedStep.columns.length-1] })"
      placeholder="Select column(s)"
      data-path=".columns"
      :errors="errors"
    />
    <AutocompleteWidget
      id="typeInput"
      name="To data type:"
      v-model="editedStep.data_type"
      :options="dataTypes"
      placeholder="Select a data type"
      data-path=".data_type"
      :errors="errors"
    />
    <step-form-buttonbar :cancel="cancelEdition" :submit="submit" />
  </div>
</template>

<script lang="ts">
import { Prop } from 'vue-property-decorator';

import { StepFormComponent } from '@/components/formlib';
import AutocompleteWidget from '@/components/stepforms/widgets/Autocomplete.vue';
import MultiselectWidget from '@/components/stepforms/widgets/Multiselect.vue';
import { ConvertStep } from '@/lib/steps';

import BaseStepForm from './StepForm.vue';

@StepFormComponent({
  vqbstep: 'convert',
  name: 'convert-step-form',
  components: {
    AutocompleteWidget,
    MultiselectWidget,
  },
})
export default class ConvertStepForm extends BaseStepForm<ConvertStep> {
  @Prop({ type: Object, default: () => ({ name: 'convert', columns: [], data_type: '' }) })
  initialStepValue!: ConvertStep;

  readonly title: string = 'Convert Columns Data Types';
  dataTypes = ['integer', 'float', 'text', 'date', 'boolean'];
}
</script>
