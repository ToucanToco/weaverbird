<template>
  <div class="data-viewer">
    <ActionToolbar :buttons="buttons" @actionClicked="openStepForm" />
    <div v-if="isLoading" class="data-viewer-loader-spinner" />
    <div v-if="!isEmpty && !isLoading" class="data-viewer-container">
      <div class="data-viewer-table-container">
        <table class="data-viewer-table">
          <thead class="data-viewer__header">
            <tr>
              <td
                v-for="(column, index) in formattedColumns"
                :class="column.class"
                :key="column.name"
                @click="toggleColumnSelection({ column: column.name })"
              >
                <span v-if="column.type" :class="iconClass" @click.stop="openDataTypeMenu(index)">
                  <span v-html="getIconType(column.type)" />
                  <DataTypesMenu
                    v-if="isSupported('convert')"
                    :column-name="column.name"
                    :is-active="column.isDataTypeMenuOpened"
                    @closed="closeDataTypeMenu"
                  />
                </span>
                <span class="data-viewer__header-label">{{ column.name }}</span>
                <i
                  class="data-viewer__header-action fas fa-angle-down"
                  @click.stop="openMenu(index)"
                >
                  <ActionMenu
                    :column-name="column.name"
                    :is-active="column.isActionMenuOpened"
                    @closed="closeMenu"
                    @actionClicked="openStepForm"
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
      <Pagination v-if="dataset.paginationContext.totalCount > pagesize" />
    </div>
    <div v-else-if="isEmpty">No data available</div>
  </div>
</template>
<script lang="ts">
import Vue from 'vue';
import { Component } from 'vue-property-decorator';

import Pagination from '@/components/Pagination.vue';
import { DataSet, DataSetColumn, DataSetColumnType } from '@/lib/dataset';
import { PipelineStepName } from '@/lib/steps';
import { getTranslator } from '@/lib/translators';
import { VQBModule } from '@/store';

import ActionMenu from './ActionMenu.vue';
import ActionToolbar from './ActionToolbar.vue';
import { CATEGORY_BUTTONS } from './constants';
import DataTypesMenu from './DataTypesMenu.vue';
import DataViewerCell from './DataViewerCell.vue';

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
    DataTypesMenu,
    DataViewerCell,
    Pagination,
  },
})
export default class DataViewer extends Vue {
  @VQBModule.State dataset!: DataSet;
  @VQBModule.State isLoading!: boolean;
  @VQBModule.State pagesize!: number;
  @VQBModule.State selectedColumns!: string[];

  @VQBModule.Getter('isDatasetEmpty') isEmpty!: boolean;
  @VQBModule.Getter columnHeaders!: DataSetColumn[];
  @VQBModule.Getter translator!: string;

  @VQBModule.Mutation createStepForm!: ({
    stepName,
    stepFormDefaults,
  }: {
    stepName: PipelineStepName;
    stepFormDefaults?: object;
  }) => void;
  @VQBModule.Mutation toggleColumnSelection!: ({ column }: { column: string }) => void;
  @VQBModule.Mutation setSelectedColumns!: ({ column }: { column: string }) => void;

  indexActiveActionMenu = -1;
  indexActiveDataTypeMenu = -1;

  /**
   * @description Get our columns with their names and linked classes
   *
   * @return {Array<object>}
   */
  get formattedColumns() {
    return this.columnHeaders.map((d, index) => {
      let isActionMenuOpened = false;
      let isDataTypeMenuOpened = false;

      if (index === this.indexActiveActionMenu) {
        isActionMenuOpened = true;
      }

      if (index === this.indexActiveDataTypeMenu) {
        isDataTypeMenuOpened = true;
      }

      return {
        name: d.name,
        type: d.type || 'undefined',
        isActionMenuOpened,
        isDataTypeMenuOpened,
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

  get iconClass() {
    if (this.isSupported('convert')) {
      return { 'data-viewer__header-icon': true, 'data-viewer__header-icon--active': true };
    } else {
      return { 'data-viewer__header-icon': true, 'data-viewer__header-icon--active': false };
    }
  }

  /**
   * @description Open the form to create a step
   *
   * @param {PipelineStepName} stepName - The name of the step we want to create
   */
  openStepForm(stepName: PipelineStepName, defaults = {}) {
    this.createStepForm({ stepName, stepFormDefaults: defaults });
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

  isSupported(step: PipelineStepName) {
    return getTranslator(this.translator).supports(step);
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
      default:
        return '???';
    }
  }

  openDataTypeMenu(index: number) {
    this.indexActiveDataTypeMenu = index;
    this.setSelectedColumns({ column: this.formattedColumns[index].name });
  }

  closeDataTypeMenu() {
    this.indexActiveDataTypeMenu = -1;
  }

  openMenu(index: number) {
    this.indexActiveActionMenu = index;
    this.setSelectedColumns({ column: this.formattedColumns[index].name });
  }

  closeMenu() {
    this.indexActiveActionMenu = -1;
  }
}
</script>
<style lang="scss" scoped>
@import '../styles/_variables';

.data-viewer {
  height: 100%;
  display: flex;
  flex-direction: column;
  @extend %main-font-style;
  /deep/ *,
  /deep/::after,
  /deep/::before {
    box-sizing: border-box;
  }

  /deep/button {
    outline: none;
  }

  /deep/fieldset {
    border: none;
  }
}

.data-viewer-container {
  width: 100%;
  overflow: auto;
  display: flex;
  flex-direction: column;
}

.data-viewer-table-container {
  width: 100%;
  max-height: 100%;
  overflow: auto;
  display: flex;
  flex-direction: column;
}

.data-viewer-table {
  border-collapse: collapse;
  width: 100%;
}

.data-viewer__header-cell,
.data-viewer-cell {
  position: relative;
  padding: 8px;
  background-color: white;
  border: 1px solid $data-viewer-border-color;
  font-size: 13px;
  text-align: left;
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: pre;
  //firefox hack for border-collapse issue
  background-clip: padding-box;
}

.data-viewer-cell {
  background-color: #fafafa;
  white-space: normal;
}

.data-viewer__header-cell--active,
.data-viewer-cell--active {
  // It's trick to have its left side colored cause of border-collapse
  border-left: 1px double;
  background-color: $active-color-faded-3;
  border-right-color: $active-color;
  border-left-color: $active-color;
}

.data-viewer__row:last-child {
  .data-viewer-cell--active {
    border-bottom-color: $active-color;
  }
}

.data-viewer__header-cell {
  cursor: pointer;
  font-weight: bold;
  padding: 6px 8px;
}

.data-viewer__header-cell--active {
  border-top-color: $active-color;
  border-left: 1px double;
  color: $active-color;

  .data-viewer__header-action:hover {
    background-color: $active-color-faded-2;
  }

  .data-viewer__header-icon {
    color: $active-color-faded;
  }

  .data-viewer__header-icon--active:hover {
    color: $active-color;
  }
}

.data-viewer__header-label {
  text-overflow: ellipsis;
  max-width: 200px;
  overflow: hidden;
  padding-right: 23px;
}

.data-viewer__header-icon {
  font-family: 'Roboto Slab', serif;
  color: #aaaaaa;
  margin-right: 6px;
}

.data-viewer__header-action {
  position: absolute;
  font-size: 18px;
  right: 10px;
  top: 6px;
  transition: opacity 300ms ease;
  display: flex;
  width: 18px;
  height: 18px;
  border-radius: 4px;
  align-items: center;
  justify-content: center;
}

.data-viewer__header-action:hover {
  background-color: $data-viewer-border-color;
}

.data-viewer__header-icon--active:hover {
  color: $base-color;
}

.data-viewer-loader-spinner {
  border-radius: 50%;
  border: 4px solid #efefef;
  border-top-color: $active-color;
  width: 50px;
  height: 50px;
  animation: spin 1500ms ease-in-out infinite;
  margin: 50px auto;
}

@keyframes spin {
  to {
    transform: rotate(1turn);
  }
}
</style>
