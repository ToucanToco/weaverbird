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

interface DataRow {
  [key: string]: any;
}

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
  dataset!: Array<object>;

  selectedColumns: Array<string> = [];

  get datasetIsntEmpty() {
    return this.dataset.length !== 0;
  }

  get columnNames() {
    return Object.keys(this.dataset[0]);
  }

  get formattedColumns() {
    return this.columnNames.map(d => ({
      name: d,
      class: {
        'data-viewer__header-cell': true,
        'data-viewer__header-cell--active': this.isSelected(d),
      },
    }));
  }

  isSelected(column: string) {
    return this.selectedColumns.includes(column);
  }

  getValue(row: DataRow, column: string) {
    return row[column];
  }

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
