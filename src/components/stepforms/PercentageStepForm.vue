<template>
  <div>
    <step-form-title :title="title"></step-form-title>
    <WidgetAutocomplete
      id="valueColumnInput"
      v-model="editedStep.column"
      name="Value column"
      :options="columnNames"
      @input="setSelectedColumns({ column: editedStep.column })"
      placeholder="Enter a column name"
    ></WidgetAutocomplete>
    <WidgetMultiselect
      id="groupbyColumnsInput"
      v-model="editedStep.group"
      name="Group by:"
      :options="columnNames"
      @input="setSelectedColumns({ column: editedStep.group[editedStep.group.length-1] })"
      placeholder="Add columns"
    ></WidgetMultiselect>
    <WidgetInputText
      id="newColumnNameInput"
      v-model="editedStep.new_column"
      name="New column name"
      placeholder="Enter a new column name"
    ></WidgetInputText>
    <step-form-buttonbar :errors="errors" :cancel="cancelEdition" :submit="submit"></step-form-buttonbar>
  </div>
</template>

<script lang="ts">
import { Prop } from 'vue-property-decorator';
import { PercentageStep } from '@/lib/steps';
import percentageSchema from '@/assets/schemas/percentage-step__schema.json';
import WidgetAutocomplete from '@/components/stepforms/WidgetAutocomplete.vue';
import WidgetInputText from './WidgetInputText.vue';
import WidgetMultiselect from './WidgetMultiselect.vue';
import BaseStepForm from './StepForm.vue';
import { StepFormComponent } from '@/components/formlib';

@StepFormComponent({
  vqbstep: 'percentage',
  name: 'percentage-step-form',
  components: {
    WidgetAutocomplete,
    WidgetInputText,
    WidgetMultiselect,
  },
})
export default class PercentageStepForm extends BaseStepForm<PercentageStep> {
  @Prop({ type: Object, default: () => ({ name: 'percentage', column: '' }) })
  initialStepValue!: PercentageStep;

  readonly title: string = 'Edit Percentage Step';

  editedStepModel = percentageSchema;

  validate() {
    const errors = this.$$super.validate();
    if (errors !== null) {
      return errors;
    }
    if (
      this.editedStep.new_column !== undefined &&
      this.columnNames.includes(this.editedStep.new_column)
    ) {
      return [
        {
          params: [],
          schemaPath: '.new_column',
          keyword: 'nameAlreadyUsed',
          dataPath: '.new_column',
          message: 'This column name is already used.',
        },
      ];
    }
    return null;
  }
}
</script>
