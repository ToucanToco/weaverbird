<template>
  <div>
    <StepFormHeader :title="title" :stepName="editedStep.name" :version="version" />
    <ColumnPicker
      class="valueColumnInput"
      v-model="editedStep.valueColumn"
      name="Value column name:"
      placeholder="Select a column"
      data-path=".valueColumn"
      :syncWithSelectedColumn="false"
      :errors="errors"
      :available-variables="availableVariables"
      :variable-delimiters="variableDelimiters"
    />
    <ColumnPicker
      class="milestonesColumnInput"
      v-model="editedStep.milestonesColumn"
      name="Column incl. start and end labels (usually dates):"
      placeholder="Select a column"
      data-path=".milestonesColumn"
      :syncWithSelectedColumn="false"
      :errors="errors"
      :available-variables="availableVariables"
      :variable-delimiters="variableDelimiters"
    />
    <InputTextWidget
      class="startInput"
      v-model="editedStep.start"
      name="Starting block label:"
      placeholder="To be found in the column above"
      data-path=".start"
      :errors="errors"
      :available-variables="availableVariables"
      :variable-delimiters="variableDelimiters"
    />
    <InputTextWidget
      class="endInput"
      v-model="editedStep.end"
      name="Ending block label:"
      placeholder="To be found in the column above"
      data-path=".end"
      :errors="errors"
      :available-variables="availableVariables"
      :variable-delimiters="variableDelimiters"
    />
    <ColumnPicker
      class="childrenColumnInput"
      v-model="editedStep.labelsColumn"
      name="Labels columns (for intermediate blocks):"
      placeholder="Select a column"
      data-path=".labelsColumn"
      :syncWithSelectedColumn="false"
      :errors="errors"
      :available-variables="availableVariables"
      :variable-delimiters="variableDelimiters"
    />
    <ColumnPicker
      class="parentsColumnInput"
      v-model="editedStep.parentsColumn"
      name="(Optional) Parents labels column (for drill-down):"
      placeholder="Select a column"
      data-path=".parentsColumn"
      :syncWithSelectedColumn="false"
      :errors="errors"
      :available-variables="availableVariables"
      :variable-delimiters="variableDelimiters"
    />
    <MultiselectWidget
      class="groupbyInput"
      v-model="editedStep.groupby"
      name="(Optional) Group waterfall by:"
      :options="columnNames"
      placeholder="Add columns"
      data-path=".groupby"
      :errors="errors"
      :available-variables="availableVariables"
      :variable-delimiters="variableDelimiters"
    />
    <AutocompleteWidget
      class="sortByInput"
      name="Sort by:"
      v-model="editedStep.sortBy"
      :options="['label', 'value']"
      data-path=".sortBy"
    />
    <AutocompleteWidget
      class="orderInput"
      name="Sort order:"
      v-model="editedStep.order"
      :options="['asc', 'desc']"
      data-path=".order"
    />
    <StepFormButtonbar />
  </div>
</template>

<script lang="ts">
import Component from 'vue-class-component';
import { Prop } from 'vue-property-decorator';

import { PipelineStepName, WaterfallStep } from '../../lib/steps';
import { VariableDelimiters, VariablesBucket } from '../../lib/variables';
import { VQBModule } from '../../store';
import AutocompleteWidget from '..//stepforms/widgets/Autocomplete.vue';
import InputTextWidget from '..//stepforms/widgets/InputText.vue';
import ColumnPicker from './ColumnPicker.vue';
import BaseStepForm from './StepForm.vue';
import MultiselectWidget from './widgets/Multiselect.vue';

@Component({
  name: 'waterfall-step-form',
  components: {
    AutocompleteWidget,
    ColumnPicker,
    InputTextWidget,
    MultiselectWidget,
  },
})
export default class WaterfallStepForm extends BaseStepForm<WaterfallStep> {
  stepname: PipelineStepName = 'waterfall';

  @VQBModule.State availableVariables?: VariablesBucket;

  @VQBModule.State variableDelimiters?: VariableDelimiters;

  @Prop({
    type: Object,
    default: () => ({
      name: 'waterfall',
      valueColumn: '',
      milestonesColumn: '',
      start: '',
      end: '',
      labelsColumn: '',
      sortBy: 'value',
      order: 'desc',
    }),
  })
  initialStepValue!: WaterfallStep;

  readonly title: string = 'Compute waterfall';
}
</script>
