<template>
  <div>
    <step-form-title :title="title"></step-form-title>

    <WidgetList
      addFieldName="Add Column"
      id="sortColumn"
      name="Sort:"
      v-model="sortColumns"
      :defaultItem="defaultSortColumn"
      :widget="widgetSortColumn"
      :automatic-new-field="false"
    ></WidgetList>

    <step-form-buttonbar :errors="errors" :cancel="cancelEdition" :submit="submit"></step-form-buttonbar>
  </div>
</template>

<script lang="ts">
import { Prop } from 'vue-property-decorator';
import { SortStep } from '@/lib/steps';
import BaseStepForm from './StepForm.vue';
import { StepFormComponent } from '@/components/formlib';
import WidgetList from './WidgetList.vue';
import { SortColumnType } from '@/lib/steps';
import WidgetSortColumn from './WidgetSortColumn.vue';

@StepFormComponent({
  vqbstep: 'sort',
  name: 'sort-step-form',
  components: {
    WidgetList,
    WidgetSortColumn,
  },
})
export default class SortStepForm extends BaseStepForm<SortStep> {
  @Prop({ type: Object, default: () => ({ name: 'sort', columns: [] }) })
  initialStepValue!: SortStep;

  readonly title: string = 'Sort';
  widgetSortColumn = WidgetSortColumn;

  get defaultSortColumn() {
    const sortColumn: SortColumnType = {
      column: '',
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

  get stepSelectedColumn() {
    if (this.editedStep.columns.length === 0) {
      return null;
    } else {
      return this.editedStep.columns[this.editedStep.columns.length - 1]['column'];
    }
  }

  set stepSelectedColumn(colname: string | null) {
    if (colname === null) {
      throw new Error('should not try to set null on filter "column" field');
    }
    const sortColNames = [];
    for (const column of this.editedStep.columns) {
      sortColNames.push(column.column);
    }
    if (colname !== null && !sortColNames.includes(colname)) {
      this.editedStep.columns.push({ column: colname, order: 'asc' });
    }
  }
}
</script>
