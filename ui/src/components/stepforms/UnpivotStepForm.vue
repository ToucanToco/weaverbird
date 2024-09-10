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
      :allowCustom="true"
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
      :allowCustom="true"
    />
    <CheckboxWidget
      v-if="translator !== 'snowflake'"
      class="dropnaCheckbox"
      :label="checkboxLabel"
      v-model="editedStep.dropna"
    />
    <StepFormButtonbar />
  </div>
</template>

<script lang="ts">
import Component from 'vue-class-component';
import { Prop } from 'vue-property-decorator';

import CheckboxWidget from '@/components/stepforms/widgets/Checkbox.vue';
import MultiselectWidget from '@/components/stepforms/widgets/Multiselect.vue';
import { generateNewColumnName } from '@/lib/helpers';
import type { PipelineStepName, UnpivotStep } from '@/lib/steps';

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

  @Prop({
    type: Object,
    default: () => ({
      name: 'unpivot',
      keep: [],
      unpivot: [],
      unpivotColumnName: '',
      valueColumnName: '',
      dropna: true,
    }),
  })
  declare initialStepValue: UnpivotStep;

  readonly title: string = 'Unpivot columns';
  readonly checkboxLabel: string = 'Drop null values';

  submit() {
    this.editedStep.unpivotColumnName = generateNewColumnName('variable', this.columnNames);
    this.editedStep.valueColumnName = generateNewColumnName('value', this.columnNames);
    this.$$super.submit();
  }
}
</script>
