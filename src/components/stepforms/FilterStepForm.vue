<template>
  <div>
    <step-form-title :title="title"></step-form-title>
    <ColumnPicker
      id="columnInput"
      v-model="editedStep.condition.column"
      name="Values in column..."
      :options="columnNames"
      @input="setSelectedColumns({ column: editedStep.condition.column })"
      placeholder="Enter a column name"
    ></ColumnPicker>
    <WidgetAutocomplete
      id="filterOperator"
      v-model="editedStep.condition.operator"
      name="Must..."
      :options="['eq', 'ne', 'gt', 'ge', 'lt', 'le', 'in', 'nin']"
      placeholder="Filter operator"
    ></WidgetAutocomplete>
    <WidgetInputText
      id="valueInput"
      v-model="editedStep.condition.value"
      name="This value:"
      placeholder="Enter the filter value here"
    ></WidgetInputText>
    <step-form-buttonbar :errors="errors" :cancel="cancelEdition" :submit="submit"></step-form-buttonbar>
  </div>
</template>

<script lang="ts">
import { Prop } from 'vue-property-decorator';
import { StepFormComponent } from '@/components/formlib';
import ColumnPicker from '@/components/stepforms/ColumnPicker.vue';
import WidgetInputText from '@/components/stepforms/WidgetInputText.vue';
import WidgetAutocomplete from '@/components/stepforms/WidgetAutocomplete.vue';
import BaseStepForm from './StepForm.vue';
import { FilterStep } from '@/lib/steps';

@StepFormComponent({
  vqbstep: 'filter',
  name: 'filter-step-form',
  components: {
    ColumnPicker,
    WidgetAutocomplete,
    WidgetInputText,
  },
})
export default class FilterStepForm extends BaseStepForm<FilterStep> {
  @Prop({
    type: Object,
    default: () => ({ name: 'filter', condition: { column: '', value: '', operator: 'eq' } }),
  })
  initialStepValue!: FilterStep;

  readonly title: string = 'Filter';
}
</script>
