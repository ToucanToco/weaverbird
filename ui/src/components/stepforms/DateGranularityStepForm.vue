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
      name="Date column:"
      :options="columnNames"
      placeholder="Pick a column"
      data-path=".column"
      :errors="errors"
      :columnNames="columnNames"
      :selectedColumns="selectedColumns"
      @setSelectedColumns="setSelectedColumns"
    />
    <!-- Uses `granularity` getter/setter to support both variables (string) and enum values (GranularityOption) -->
    <AutocompleteWidget
      class="dateInfoInput"
      v-model="granularity"
      name="Date granularity to apply:"
      :options="granularities"
      :trackBy="`info`"
      :label="`label`"
      placeholder="Select one or several"
      data-path=".granularity"
      :available-variables="availableVariables"
      :variable-delimiters="variableDelimiters"
      :trusted-variable-delimiters="trustedVariableDelimiters"
      :errors="errors"
    />
    <InputTextWidget
      class="newColumnInput"
      v-model="editedStep.newColumn"
      name="New column:"
      placeholder="Enter a new column name or leave empty to overwrite the original one"
      data-path=".newColumn"
      :warning="duplicateColumnName"
      :errors="errors"
    />
    <StepFormButtonbar />
  </div>
</template>

<script lang="ts">
import Component from 'vue-class-component';
import { Prop } from 'vue-property-decorator';

import ColumnPicker from './ColumnPicker.vue';
import InputTextWidget from '@/components/stepforms/widgets/InputText.vue';
import type { DateGranularity, DateGranularityStep, PipelineStepName } from '@/lib/steps';
import BaseStepForm from './StepForm.vue';
import AutocompleteWidget from './widgets/Autocomplete.vue';

type GranularityOption = {
  info: DateGranularity;
  label: string;
};

@Component({
  name: 'dategranularity-step-form',
  components: {
    ColumnPicker,
    InputTextWidget,
    AutocompleteWidget,
  },
})
export default class DateGranularityStepForm extends BaseStepForm<DateGranularityStep> {
  stepname: PipelineStepName = 'dategranularity';

  @Prop({
    type: Object,
    default: () => ({
      name: 'dategranularity',
      column: '',
      granularity: '',
    }),
  })
  declare initialStepValue: DateGranularityStep;

  readonly title: string = 'Normalize Date Granularity';

  readonly granularities: GranularityOption[] = [
    { info: 'year', label: 'year' },
    { info: 'quarter', label: 'quarter' },
    { info: 'month', label: 'month' },
    { info: 'isoWeek', label: 'ISO week (monday to monday)' },
    { info: 'week', label: 'week (sunday to sunday)' },
    { info: 'day', label: 'day' },
  ];

  /** Overload the definition of editedStep in BaseStepForm to guarantee
   * retrocompatibility with legacy configurations */
  editedStep = {
    ...this.initialStepValue,
    ...this.stepFormDefaults,
  };

  get duplicateColumnName() {
    if (this.editedStep.newColumn && this.columnNames.includes(this.editedStep.newColumn)) {
      return `A column with name "${this.editedStep.newColumn}" already exists. You will overwrite it.`;
    } else {
      return null;
    }
  }

  get granularity(): GranularityOption {
    const enumOption = this.granularities.filter((d) => d.info === this.editedStep.granularity)[0];
    return enumOption ?? this.editedStep.granularity;
  }

  set granularity(input: GranularityOption | string | undefined) {
    this.editedStep.granularity = typeof input == 'string' ? input : input?.info ?? '';
  }
}
</script>
