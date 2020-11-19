<template>
  <div>
    <StepFormHeader :title="title" :stepName="editedStep.name" :version="version" />
    <InputTextWidget
      class="limitInput"
      v-model.number="editedStep.limit"
      type="number"
      name="Get top..."
      placeholder="Enter a number of rows"
      data-path=".limit"
      :errors="errors"
    />
    <ColumnPicker
      class="rankOnInput"
      v-model="editedStep.rank_on"
      name="Sort column..."
      placeholder="Enter a column"
      :syncWithSelectedColumn="false"
      data-path=".rank_on"
      :errors="errors"
      :available-variables="availableVariables"
      :variable-delimiters="variableDelimiters"
    />
    <AutocompleteWidget
      class="sortOrderInput"
      v-model="editedStep.sort"
      name="Sort order:"
      :options="['asc', 'desc']"
      placeholder="Select an order"
      data-path=".sort"
      :errors="errors"
    />
    <MultiselectWidget
      class="groupbyColumnsInput"
      v-model="editedStep.groups"
      name="(Optional) Group by..."
      :options="columnNames"
      placeholder="Select columns"
      data-path=".groups"
      :errors="errors"
      :available-variables="availableVariables"
      :variable-delimiters="variableDelimiters"
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
import { PipelineStepName, TopStep } from '@/lib/steps';
import { VariableDelimiters, VariablesBucket } from '@/lib/variables';
import { VQBModule } from '@/store';

import BaseStepForm from './StepForm.vue';
import MultiselectWidget from './widgets/Multiselect.vue';

@Component({
  name: 'top-step-form',
  components: {
    ColumnPicker,
    AutocompleteWidget,
    InputTextWidget,
    MultiselectWidget,
  },
})
export default class TopStepForm extends BaseStepForm<TopStep> {
  stepname: PipelineStepName = 'top';

  @VQBModule.State availableVariables?: VariablesBucket;

  @VQBModule.State variableDelimiters?: VariableDelimiters;

  @Prop({ type: Object, default: () => ({ name: 'top', rank_on: '', sort: 'asc' }) })
  initialStepValue!: TopStep;

  readonly title: string = 'Top N rows';

  get stepSelectedColumn() {
    return this.editedStep.rank_on;
  }

  set stepSelectedColumn(colname: string | null) {
    if (colname === null) {
      throw new Error('should not try to set null on top "rank_on" field');
    }
    this.editedStep.rank_on = colname;
  }
}
</script>
