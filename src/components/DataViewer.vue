<template>
  <div v-if="!isEmpty" class="data-viewer-container">
    <ActionToolbar :buttons="buttons"></ActionToolbar>
    <table class="data-viewer-table">
      <thead class="data-viewer__header">
        <tr>
          <td
            v-for="column in formattedColumns"
            :class="column.class"
            :key="column.name"
            @click="toggleColumnSelection(column.name)"
          >{{ column.name }}</td>
        </tr>
      </thead>
      <tbody class="data-viewer__body">
        <tr class="data-viewer__row" v-for="(row, index) in dataset.data" :key="index">
          <DataViewerCell
            v-for="(cell, cellidx) in row"
            :key="cellidx"
            :isSelected="isSelected(columnNames[cellidx])"
            :value="cell"
          />
        </tr>
      </tbody>
    </table>
  </div>
  <div v-else>No data available</div>
</template>
<script lang="ts">
import _ from 'lodash';
import Vue from 'vue';
import { Getter, State } from 'vuex-class';

import { DataSet } from '@/lib/dataset';
import { Component } from 'vue-property-decorator';
import DataViewerCell from './DataViewerCell.vue';
import ActionToolbar from './ActionToolbar.vue';
import { CATEGORY_BUTTONS } from './constants';

/**
 * @name DataViewer
 * @description A Vue Component that displays data into a table
 * @param {DataSet} dataset - The dataset that we want to display
 */
@Component({
  name: 'data-viewer',
  components: {
    DataViewerCell,
    ActionToolbar
  },
})
export default class DataViewer extends Vue {
  @State('dataset') dataset!: DataSet;
  @Getter('isDatasetEmpty') isEmpty!: boolean;

  @Getter columnNames!: string[];

  /**
   * @description Array of column's name selected by the user
   */
  selectedColumns: string[] = [];

  /**
   * @description Get our columns with their names and linked classes
   *
   * @return {Array<object>}
   */
  get formattedColumns() {
    return this.columnNames.map(d => ({
      name: d,
      class: {
        'data-viewer__header-cell': true,
        'data-viewer__header-cell--active': this.isSelected(d),
      },
    }));
  }

  get buttons() {
    return CATEGORY_BUTTONS;
  }

  /**
   * @description Tell us if our column is selected or not
   *
   * @param {string} column - A column name
   * @return {boolean}
   */
  isSelected(column: string) {
    return this.selectedColumns.includes(column);
  }

  /**
   * @description Select or deselect a column by its name
   *
   * @param {string} column - A column name
   */
  toggleColumnSelection(column: string) {
    if (this.selectedColumns.includes(column)) {
      this.selectedColumns = _.without(this.selectedColumns, column);
    } else {
      this.selectedColumns = [...this.selectedColumns, column];
    }
  }
}
</script>
<style lang="scss" scoped>
@import '../styles/DataViewer';
</style>
