<template>
  <div>
    <StepFormHeader
      :title="title"
      :stepName="editedStep.name"
      :version="version"
      :backendError="backendError"
    />
    <MultiselectWidget
      class="keepColumnInput"
      v-model="editedStep.keep"
      name="Keep columns..."
      :options="columnNames"
      @input="setSelectedColumns({ column: editedStep.keep[0] })"
      placeholder="Add columns to keep"
      data-path=".keep"
      :errors="errors"
      :available-variables="availableVariables"
      :variable-delimiters="variableDelimiters"
    />
    <MultiselectWidget
      class="unpivotColumnInput"
      v-model="editedStep.unpivot"
      name="Unpivot columns..."
      :options="columnNames"
      @input="setSelectedColumns({ column: editedStep.unpivot[0] })"
      placeholder="Add columns to unpivot"
      data-path=".unpivot"
      :errors="errors"
      :available-variables="availableVariables"
      :variable-delimiters="variableDelimiters"
    />
    <CheckboxWidget class="dropnaCheckbox" :label="checkboxLabel" v-model="editedStep.dropna" />
    <StepFormButtonbar />
  </div>
</template>

<script lang="ts">
import Component from 'vue-class-component';
import { Prop } from 'vue-property-decorator';

import CheckboxWidget from '@/components/stepforms/widgets/Checkbox.vue';
import MultiselectWidget from '@/components/stepforms/widgets/Multiselect.vue';
import { generateNewColumnName } from '@/lib/helpers';
import { PipelineStepName, UnpivotStep } from '@/lib/steps';
import { VariableDelimiters, VariablesBucket } from '@/lib/variables';
import { VQBModule } from '@/store';

import BaseStepForm from './StepForm.vue';

@Component({
  name: 'unpivot-step-form',
  components: {
    CheckboxWidget,
    MultiselectWidget,
  },
})
export default class UnpivotStepForm extends BaseStepForm<UnpivotStep> {
  stepname: PipelineStepName = 'unpivot';

  @VQBModule.State availableVariables?: VariablesBucket;

  @VQBModule.State variableDelimiters?: VariableDelimiters;

  @Prop({
    type: Object,
    default: () => ({
      name: 'unpivot',
      keep: [],
      unpivot: [],
      unpivot_column_name: '',
      value_column_name: '',
      dropna: true,
    }),
  })
  initialStepValue!: UnpivotStep;

  readonly title: string = 'Unpivot columns';
  readonly checkboxLabel: string = 'Drop null values';

  submit() {
    this.editedStep.unpivot_column_name = generateNewColumnName('variable', this.columnNames);
    this.editedStep.value_column_name = generateNewColumnName('value', this.columnNames);
    this.$$super.submit();
  }
}
</script>
