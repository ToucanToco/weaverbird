<template>
  <div>
    <step-form-header :cancel="cancelEdition" :title="title" :stepName="this.editedStep.name" />
    <ListWidget
      addFieldName="Add Column"
      id="sortColumn"
      v-model="sortColumns"
      :defaultItem="defaultSortColumn"
      :widget="widgetSortColumn"
      :automatic-new-field="false"
      data-path=".columns"
      :errors="errors"
    />

    <step-form-buttonbar :cancel="cancelEdition" :submit="submit" />
  </div>
</template>

<script lang="ts">
import { Prop } from 'vue-property-decorator';

import { SortStep, SortColumnType } from '@/lib/steps';
import { StepFormComponent } from '@/components/formlib';

import BaseStepForm from './StepForm.vue';
import ListWidget from './widgets/List.vue';
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
