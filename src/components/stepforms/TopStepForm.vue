<template>
  <div>
    <step-form-title :title="title"></step-form-title>
    <InputTextWidget
      id="limitInput"
      v-model.number="editedStep.limit"
      type="number"
      name="Get top..."
      placeholder="Enter a number of rows"
      data-path=".limit"
      :errors="errors"
    ></InputTextWidget>
    <ColumnPicker
      id="rankOnInput"
      v-model="editedStep.rank_on"
      name="Sort column..."
      placeholder="Enter a column"
      data-path=".rank_on"
      :errors="errors"
    ></ColumnPicker>
    <AutocompleteWidget
      id="sortOrderInput"
      v-model="editedStep.sort"
      name="Sort order:"
      :options="['asc', 'desc']"
      placeholder="Select an order"
      data-path=".sort"
      :errors="errors"
    ></AutocompleteWidget>
    <MultiselectWidget
      id="groupbyColumnsInput"
      v-model="editedStep.groups"
      name="(Optional) Group by..."
      :options="columnNames"
      @input="setSelectedColumns({ column: editedStep.groups[editedStep.groups.length-1] })"
      placeholder="Select columns"
      data-path=".groups"
      :errors="errors"
    ></MultiselectWidget>
    <step-form-buttonbar :cancel="cancelEdition" :submit="submit"></step-form-buttonbar>
  </div>
</template>

<script lang="ts">
import { Prop } from 'vue-property-decorator';
import { TopStep } from '@/lib/steps';
import ColumnPicker from '@/components/stepforms/ColumnPicker.vue';
import AutocompleteWidget from '@/components/stepforms/widgets/Autocomplete.vue';
import InputTextWidget from '@/components/stepforms/widgets/InputText.vue';
import MultiselectWidget from './widgets/Multiselect.vue';
import BaseStepForm from './StepForm.vue';
import { StepFormComponent } from '@/components/formlib';

@StepFormComponent({
  vqbstep: 'top',
  name: 'top-step-form',
  components: {
    ColumnPicker,
    AutocompleteWidget,
    InputTextWidget,
    MultiselectWidget,
  },
})
export default class TopStepForm extends BaseStepForm<TopStep> {
  @Prop({ type: Object, default: () => ({ name: 'top', rank_on: '', sort: 'asc' }) })
  initialStepValue!: TopStep;

  readonly title: string = 'Top N rows';
}
</script>
