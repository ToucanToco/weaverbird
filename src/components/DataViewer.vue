<template>
  <div>
    <ActionToolbar :buttons="buttons" @actionClicked="createStep"></ActionToolbar>
    <div v-if="isLoading" class="data-viewer-loader-spinner"></div>
    <div v-if="!isEmpty && !isLoading" class="data-viewer-container">
      <table class="data-viewer-table">
        <thead class="data-viewer__header">
          <tr>
            <td
              v-for="(column, index) in formattedColumns"
              :class="column.class"
              :key="column.name"
              @click="toggleColumnSelection({ column: column.name})"
            >
              <span
                v-if="column.type"
                v-html="getIconType(column.type)"
                class="data-viewer__header-icon"
              ></span>
              <span class="data-viewer__header-label">{{ column.name }}</span>
              <i
                class="data-viewer__header-action fas fa-angle-down"
                :class="{'data-viewer__header-action--visible': column.isActionMenuOpened}"
                @click.stop="openMenu(index)"
              >
                <ActionMenu
                  :column-name="column.name"
                  :is-active="column.isActionMenuOpened"
                  @closed="closeMenu"
                  @actionClicked="createStep"
                />
              </i>
            </td>
          </tr>
        </thead>
        <tbody class="data-viewer__body">
          <tr class="data-viewer__row" v-for="(row, index) in dataset.data" :key="index">
            <DataViewerCell
              v-for="(cell, cellidx) in row"
              :key="cellidx"
              :isSelected="isSelected(columnHeaders[cellidx].name)"
              :value="cell"
            />
          </tr>
        </tbody>
      </table>
    </div>
    <div v-else-if="isEmpty">No data available</div>
  </div>
</template>
<script lang="ts">
import Vue from 'vue';
import { Getter, Mutation, State } from 'vuex-class';

import { DataSet, DataSetColumn, DataSetColumnType } from '@/lib/dataset';
import { PipelineStepName } from '@/lib/steps';
import { Component } from 'vue-property-decorator';
import ActionMenu from './ActionMenu.vue';
import ActionToolbar from './ActionToolbar.vue';
import DataViewerCell from './DataViewerCell.vue';
import { CATEGORY_BUTTONS } from './constants';

/**
 * @name DataViewer
 * @description A Vue Component that displays data into a table
 * @param {DataSet} dataset - The dataset that we want to display
 */
@Component({
  name: 'data-viewer',
  components: {
    ActionMenu,
    ActionToolbar,
    DataViewerCell,
  },
})
export default class DataViewer extends Vue {
  @State dataset!: DataSet;
  @State selectedColumns!: string[];

  @Getter('isDatasetEmpty') isEmpty!: boolean;
  @Getter columnHeaders!: DataSetColumn[];

  @Mutation toggleColumnSelection!: ({ column }: { column: string }) => void;
  @Mutation setSelectedColumns!: ({ column }: { column: string }) => void;

  indexActiveActionMenu: number = -1;

  @State isLoading!: boolean;
  @Mutation toggleIsLoading!: () => void;

  /**
   * @description Get our columns with their names and linked classes
   *
   * @return {Array<object>}
   */
  get formattedColumns() {
    return this.columnHeaders.map((d, index) => {
      let isActionMenuOpened = false;

      if (index === this.indexActiveActionMenu) {
        isActionMenuOpened = true;
      }

      return {
        name: d.name,
        type: d.type || undefined,
        isActionMenuOpened,
        class: {
          'data-viewer__header-cell': true,
          'data-viewer__header-cell--active': this.isSelected(d.name),
        },
      };
    });
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

  getIconType(type: DataSetColumnType) {
    switch (type) {
      case 'string':
        return 'ABC';
      case 'integer':
        return '123';
      case 'float':
        return '1.2';
      case 'date':
        return '<i class="fas fa-calendar-alt"></i>';
      case 'boolean':
        return '<i class="fas fa-check"></i>';
      case 'object':
        return '{ }';
    }
  }

  openMenu(index: number) {
    this.indexActiveActionMenu = index;
    this.setSelectedColumns({ column: this.formattedColumns[index].name });
  }

  closeMenu() {
    this.indexActiveActionMenu = -1;

  }

  /**
   * @description Emit an event in order to open the form to create a step
   *
   * @param {PipelineStepName} stepName - The name of the step we want to create
   */
  createStep(stepName: PipelineStepName) {
    this.$emit('stepCreated', stepName);
  }
}
</script>
<style lang="scss" scoped>
@import '../styles/_variables';
@import '../styles/DataViewer';

.data-viewer-loader-spinner {
  border-radius: 50%;
  border: 4px solid #efefef;
  border-top-color: $active-color;
  width: 50px;
  height: 50px;
  animation: spin 1500ms ease-in-out infinite;
  margin: 50px auto;
}

@keyframes spin{
  to{
      transform:rotate(1turn);
    }
}
</style>
