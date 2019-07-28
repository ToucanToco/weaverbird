<template>
  <div>
    <step-form-title :title="title"></step-form-title>

    <ListWidget
      addFieldName="Add Column"
      id="sortColumn"
      v-model="sortColumns"
      :defaultItem="defaultSortColumn"
      :widget="widgetSortColumn"
      :automatic-new-field="false"
    ></ListWidget>

    <step-form-buttonbar :errors="errors" :cancel="cancelEdition" :submit="submit"></step-form-buttonbar>
  </div>
</template>

<script lang="ts">
import { Prop } from 'vue-property-decorator';
import { SortStep } from '@/lib/steps';
import BaseStepForm from './StepForm.vue';
import { StepFormComponent } from '@/components/formlib';
import ListWidget from './widgets/List.vue';
import { SortColumnType } from '@/lib/steps';
import SortColumnWidget from './widgets/SortColumn.vue';

@StepFormComponent({
  vqbstep: 'sort',
  name: 'sort-step-form',
  components: {
    ListWidget,
    SortColumnWidget,
  },
})
export default class SortStepForm extends BaseStepForm<SortStep> {
  @Prop({ type: Object, default: () => ({ name: 'sort', columns: [] }) })
  initialStepValue!: SortStep;

  readonly title: string = 'Sort';
  widgetSortColumn = SortColumnWidget;

  get defaultSortColumn() {
    const column = this.selectedColumns.length === 0 ? '' : this.selectedColumns[0];
    const sortColumn: SortColumnType = {
      column,
      order: 'asc',
    };
    return sortColumn;
  }

  get sortColumns() {
    if (this.editedStep.columns.length) {
      return this.editedStep.columns;
    } else {
      return [this.defaultSortColumn];
    }
  }

  set sortColumns(newval) {
    this.editedStep.columns = [...newval];
  }
}
</script>
