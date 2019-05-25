<template>
  <div v-if="!isEmpty" class="data-viewer-container">
    <table class="data-viewer-table">
      <thead class="data-viewer__header">
        <tr>
          <td
            v-for="column in formattedColumns"
            :class="column.class"
            :key="column.name"
            @click="toggleColumnSelection(column.name)"
          >
            <span class="data-viewer__header-label">{{ column.name }}</span>
            <i class="data-viewer__header-action fas fa-angle-down" @click="openStep(column.name)"></i>
          </td>
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
import { Getter, Mutation, State } from 'vuex-class';

import { DataSet } from '@/lib/dataset';
import { Component } from 'vue-property-decorator';
import DataViewerCell from './DataViewerCell.vue';

/**
 * @name DataViewer
 * @description A Vue Component that displays data into a table
 * @param {DataSet} dataset - The dataset that we want to display
 */
@Component({
  name: 'data-viewer',
  components: {
    DataViewerCell,
  },
})
export default class DataViewer extends Vue {
  @State dataset!: DataSet;
  @State selectedColumns!: string[];

  @Getter('isDatasetEmpty') isEmpty!: boolean;
  @Getter columnNames!: string[];

  @Mutation toggleColumnSelection!: (column: string) => void;

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

  /**
   * @description Tell us if our column is selected or not
   *
   * @param {string} column - A column name
   * @return {boolean}
   */
  isSelected(column: string) {
    return this.selectedColumns.includes(column);
  }

  // FIXME: for now it send only 'rename' step
  /**
   * @description Launch a step
   *
   * @param {string} columnName - A column name
   */
  openStep(columnName: string) {
    this.$emit('stepCreated', { name: 'rename', oldname: columnName });
  }
}
</script>
<style lang="scss" scoped>
@import '../styles/DataViewer';
</style>
