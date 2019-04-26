<template>
  <div v-if="datasetIsntEmpty" class="data-viewer-container">
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
        <tr class="data-viewer__row" v-for="(row, index) in dataset" :key="index">
          <DataViewerCell
            v-for="columnName in columnNames"
            :key="columnName"
            :isSelected="isSelected(columnName)"
            :value="getValue(row, columnName)"
          />
        </tr>
      </tbody>
    </table>
  </div>
  <div v-else>No Data Available</div>
</template>
<script lang="ts">
import _ from 'lodash';
import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';
import DataViewerCell from './DataViewerCell.vue';

/**
 * @name DataRow
 * @description A simple interface that represent a row from a dataset
 */
interface DataRow {
  [key: string]: any;
}

/**
 * @name DataViewer
 * @description A Vue Component that displays data into a table
 * @param {Array<DataRow>} dataset - The dataset that we want to display
 */
@Component({
  name: 'data-viewer',
  components: {
    DataViewerCell,
  },
})
export default class DataViewer extends Vue {
  @Prop({
    default: () => [],
    type: Array,
  })
  dataset!: Array<DataRow>;

  /**
   * @description Array of column's name selected by the user
   */
  selectedColumns: Array<string> = [];

  /**
   * @description Tell us if the dataset is not empty
   * @return {boolean}
   */
  get datasetIsntEmpty() {
    return this.dataset.length !== 0;
  }

  /**
   * @description Get columns name by checking all the rows to handle
   * the case when a row has a key that another hasn't
   *
   * @return {Array<string>}
   */
  get columnNames() {
    return _.chain(this.dataset)
      .flatMap(row => _.keys(row))
      .uniq()
      .value();
  }

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

  /**
   * @description Return the value from a specific cell
   *
   * @param {DataRow} row - A row from our dataset
   * @param {string} column - A column name
   * @return {any}
   */
  getValue(row: DataRow, column: string) {
    return row[column];
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
