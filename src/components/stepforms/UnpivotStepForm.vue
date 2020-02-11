<template>
  <div>
    <step-form-header :cancel="cancelEdition" :title="title" :stepName="this.editedStep.name" />
    <MultiselectWidget
      id="keepColumnInput"
      v-model="editedStep.keep"
      name="Keep columns..."
      :options="columnNames"
      @input="setSelectedColumns({ column: editedStep.keep[0] })"
      placeholder="Add columns to keep"
      data-path=".keep"
      :errors="errors"
    />
    <MultiselectWidget
      id="unpivotColumnInput"
      v-model="editedStep.unpivot"
      name="Unpivot columns..."
      :options="columnNames"
      @input="setSelectedColumns({ column: editedStep.unpivot[0] })"
      placeholder="Add columns to unpivot"
      data-path=".unpivot"
      :errors="errors"
    />
    <CheckboxWidget id="dropnaCheckbox" :label="checkboxLabel" v-model="editedStep.dropna" />
    <step-form-buttonbar :submit="submit" />
  </div>
</template>

<script lang="ts">
import { Prop } from 'vue-property-decorator';

import { StepFormComponent } from '@/components/formlib';
import CheckboxWidget from '@/components/stepforms/widgets/Checkbox.vue';
import MultiselectWidget from '@/components/stepforms/widgets/Multiselect.vue';
import { generateNewColumnName } from '@/lib/helpers';
import { UnpivotStep } from '@/lib/steps';

import BaseStepForm from './StepForm.vue';

@StepFormComponent({
  vqbstep: 'unpivot',
  name: 'unpivot-step-form',
  components: {
    CheckboxWidget,
    MultiselectWidget,
  },
})
export default class UnpivotStepForm extends BaseStepForm<UnpivotStep> {
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
