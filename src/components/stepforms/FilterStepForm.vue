<template>
  <div>
    <step-form-title :title="title"></step-form-title>
    <WidgetAutocomplete
      id="columnInput"
      v-model="editedStep.column"
      name="Column"
      :options="columnNames"
      @input="setSelectedColumns({ column: editedStep.column })"
      placeholder="Enter the column name"
    ></WidgetAutocomplete>
    <WidgetInputText
      id="valueInput"
      v-model="editedStep.value"
      name="Value"
      placeholder="Enter the filter value here"
    ></WidgetInputText>
    <WidgetAutocomplete
      id="filterOperator"
      v-model="editedStep.operator"
      name="Operator"
      :options="operators"
      placeholder="Filter operator"
    ></WidgetAutocomplete>
    <step-form-buttonbar :errors="errors" :cancel="cancelEdition" :submit="submit"></step-form-buttonbar>
  </div>
</template>

<script lang="ts">
import { Prop } from 'vue-property-decorator';
import filterSchema from '@/assets/schemas/filter-step__schema.json';
import { StepFormComponent } from '@/components/formlib';
import WidgetInputText from '@/components/stepforms/WidgetInputText.vue';
import WidgetAutocomplete from '@/components/stepforms/WidgetAutocomplete.vue';
import BaseStepForm from './StepForm.vue';
import { FilterStep } from '@/lib/steps';


@StepFormComponent({
  vqbstep: 'filter',
  name: 'filter-step-form',
  components: {
    WidgetAutocomplete,
    WidgetInputText,
  },
})
export default class FilterStepForm extends BaseStepForm<FilterStep> {
  @Prop({ type: Object, default: () => ({ name: 'filter', column: '', value: '', operator: 'eq' }) })
  initialStepValue!: FilterStep;

  readonly title: string = 'Edit Filter Step';
  editedStepModel = filterSchema;
  operators: FilterStep['operator'][] = ['eq', 'ne', 'gt', 'ge', 'lt', 'le', 'in', 'nin'];

  get stepSelectedColumn() {
    return this.editedStep.column;
  }

  set stepSelectedColumn(colname: string | null) {
    if (colname === null) {
      throw new Error('should not try to set null on filter "column" field');
    }
    if (colname !== null) {
      this.editedStep.column = colname;
    }
  }
}
</script>
