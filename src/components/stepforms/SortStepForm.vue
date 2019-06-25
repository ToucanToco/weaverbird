<template>
  <div>
    <step-form-title :title="title"></step-form-title>
    <WidgetList addFieldName="Sort by" id="sortby" name="Sort" :automatic-new-field="false"></WidgetList>

    <WidgetAutocomplete
      id="sortBy"
      v-model="editedStep.column"
      name="Sort"
      :options="columnNames"
      @input="setSelectedColumns({ column: editedStep.column })"
      placeholder="Select the sort type"
    ></WidgetAutocomplete>
    <step-form-buttonbar :errors="errors" :cancel="cancelEdition" :submit="submit"></step-form-buttonbar>
  </div>
</template>

<script lang="ts">
import { Prop } from 'vue-property-decorator';
import { SortStep } from '@/lib/steps';
import BaseStepForm from './StepForm.vue';
import { StepFormComponent } from '@/components/formlib';
import SortSchema from '@/assets/schemas/sort-step__schema.json';
import WidgetList from './WidgetList.vue';

@StepFormComponent({
  vqbstep: 'sort',
  name: 'sort-step-form',
  components: {
    WidgetList,
  },
})
export default class SortStepForm extends BaseStepForm<SortStep> {
  @Prop({ type: Object, default: () => ({ name: 'sort', columns: [], order: [] }) })
  initialStepValue!: SortStep;

  readonly title: string = 'Edit Sort Step';
  editedStepModel = SortSchema;

  get stepSelectedColumn() {
    return this.editedStep.columns;
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
<style lang="scss" scoped>
@import '../../styles/_variables';
</style>
