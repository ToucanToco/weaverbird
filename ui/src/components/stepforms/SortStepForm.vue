<template>
  <div>
    <StepFormHeader
      :title="title"
      :stepName="editedStep.name"
      :version="version"
      :backendError="backendError"
    />
    <ListWidget
      addFieldName="Add Column"
      class="sortColumn"
      v-model="sortColumns"
      :widget="widgetSortColumn"
      :defaultItem="{ column: '', order: 'asc' }"
      :automatic-new-field="false"
      data-path=".columns"
      :errors="errors"
      :columnNames="columnNames"
      :selectedColumns="selectedColumns"
      @setSelectedColumns="setSelectedColumns"
    />

    <StepFormButtonbar />
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';

import type { PipelineStepName, SortStep } from '@/lib/steps';
import BaseStepForm from './StepForm.vue';
import ListWidget from './widgets/List.vue';
import SortColumnWidget from './widgets/SortColumn.vue';

export default defineComponent({
  name: 'sort-step-form',
  components: {
    ListWidget,
    SortColumnWidget,
  },
  extends: BaseStepForm,
  props: {
    initialStepValue: {
      type: Object as PropType<SortStep>,
      default: (): SortStep => ({ name: 'sort', columns: [{ column: '', order: 'asc' }] }),
    },
  },
  data() {
    return {
      stepname: 'sort' as PipelineStepName,
      title: 'Sort' as string,
      widgetSortColumn: SortColumnWidget,
      editedStep: {
        ...this.initialStepValue,
        ...this.stepFormDefaults,
      },
    };
  },
  computed: {
    sortColumns: {
      get() {
        return this.editedStep.columns;
      },
      set(newval) {
        this.editedStep.columns = [...newval];
      },
    },
  },
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
  },
});
</script>
