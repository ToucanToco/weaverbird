<template>
  <div>
    <StepFormHeader :title="title" :stepName="this.editedStep.name" />
    <ListWidget
      addFieldName="Add Column"
      id="sortColumn"
      v-model="sortColumns"
      :widget="widgetSortColumn"
      :defaultItem="{ column: '', order: 'asc' }"
      :automatic-new-field="false"
      data-path=".columns"
      :errors="errors"
    />

    <StepFormButtonbar />
  </div>
</template>

<script lang="ts">
import { Prop } from 'vue-property-decorator';

import { StepFormComponent } from '@/components/formlib';
import { SortStep } from '@/lib/steps';

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
  @Prop({
    type: Object,
    default: () => ({ name: 'sort', columns: [{ column: '', order: 'asc' }] }),
  })
  initialStepValue!: SortStep;

  readonly title: string = 'Sort';
  widgetSortColumn = SortColumnWidget;

  created() {
    // If a step has not been edited and a column is selected in the data table,
    // suggest to sort by thus column in ascending order by default
    if (this.editedStep.columns[0].column === '' && this.selectedColumns.length > 0) {
      this.editedStep.columns = [
        {
          column: this.selectedColumns[0],
          order: 'asc',
        },
      ];
    }
  }

  get sortColumns() {
    return this.editedStep.columns;
  }

  set sortColumns(newval) {
    this.editedStep.columns = [...newval];
  }
}
</script>
