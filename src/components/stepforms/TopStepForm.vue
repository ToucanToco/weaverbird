<template>
  <div>
    <step-form-title :title="title"></step-form-title>
    <WidgetInputText
      id="limitInput"
      v-model.number="editedStep.limit"
      type="number"
      name="Get top..."
      placeholder="Enter a number of rows"
    ></WidgetInputText>
    <ColumnPicker
      id="rankOnInput"
      v-model="editedStep.rank_on"
      name="Sort column..."
      placeholder="Enter a column"
    ></ColumnPicker>
    <WidgetAutocomplete
      id="sortOrderInput"
      v-model="editedStep.sort"
      name="Sort order:"
      :options="['asc', 'desc']"
      placeholder="Select an order"
    ></WidgetAutocomplete>
    <WidgetMultiselect
      id="groupbyColumnsInput"
      v-model="editedStep.groups"
      name="(Optional) Group by..."
      :options="columnNames"
      @input="setSelectedColumns({ column: editedStep.groups[editedStep.groups.length-1] })"
      placeholder="Select columns"
    ></WidgetMultiselect>
    <step-form-buttonbar :errors="errors" :cancel="cancelEdition" :submit="submit"></step-form-buttonbar>
  </div>
</template>

<script lang="ts">
import { Prop } from 'vue-property-decorator';
import { TopStep } from '@/lib/steps';
import ColumnPicker from '@/components/stepforms/ColumnPicker.vue';
import WidgetAutocomplete from '@/components/stepforms/WidgetAutocomplete.vue';
import WidgetInputText from '@/components/stepforms/WidgetInputText.vue';
import WidgetMultiselect from './WidgetMultiselect.vue';
import BaseStepForm from './StepForm.vue';
import { StepFormComponent } from '@/components/formlib';

@StepFormComponent({
  vqbstep: 'top',
  name: 'top-step-form',
  components: {
    ColumnPicker,
    WidgetAutocomplete,
    WidgetInputText,
    WidgetMultiselect,
  },
})
export default class TopStepForm extends BaseStepForm<TopStep> {
  @Prop({ type: Object, default: () => ({ name: 'top', rank_on: '', sort: 'asc' }) })
  initialStepValue!: TopStep;

  readonly title: string = 'Top N rows';
}
</script>
