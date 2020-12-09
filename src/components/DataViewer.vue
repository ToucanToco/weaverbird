<template>
  <div class="data-viewer" v-if="pipeline">
    <ActionToolbar @actionClicked="openStepForm" />
    <div v-if="isLoading.dataset" class="data-viewer-loader-spinner" />
    <div v-if="!isEmpty && !isLoading.dataset" class="data-viewer-container">
      <div class="data-viewer-table-container">
        <table
          aria-hidden="true"
          class="data-viewer-table"
          v-resizable="{
            columns: columnNames,
            classes: {
              table: 'data-viewer-table--resizable',
              handler: 'data-viewer__header-cell--resizable',
            },
          }"
        >
          <thead class="data-viewer__header">
            <tr>
              <td
                v-for="column in formattedColumns"
                :class="column.class"
                :key="column.name"
                @click="toggleColumnSelection({ column: column.name })"
              >
                <span
                  v-if="column.type"
                  :class="iconClass"
                  @click.stop="openDataTypeMenu(column.name)"
                >
                  <DataTypesMenu
                    :column-name="column.name"
                    :visible="isSupported('convert') && column.isDataTypeMenuOpened"
                    @actionClicked="openStepForm"
                    @closed="closeDataTypeMenu"
                  />
                  <span v-html="getIconType(column.type)" />
                </span>
                <span class="data-viewer__header-label">{{ column.name }}</span>
                <span class="data-viewer__header-action-filter" @click.stop="openVariablesMenu(column.name)">
                  <VariableChooser
                    :available-variables="availableVariables"
                    :is-opened="activeVariablesMenuColumnName == column.name"
                    :value="filterValue"
                    @input="setFilterWithVariable($event, column.name)"
                    @closed="closeVariablesMenu"
                  />
                  <i class="fas fa-filter" aria-hidden="true" />
                </span>
                <span class="data-viewer__header-action" @click.stop="openMenu(column.name)">
                  <ActionMenu
                    :column-name="column.name"
                    :visible="column.isActionMenuOpened"
                    @closed="closeMenu"
                    @actionClicked="openStepForm"
                  />
                  <i class="fas fa-angle-down" aria-hidden="true" />
                </span>
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
      <Pagination />
    </div>
    <div v-else-if="isEmpty">No data available</div>
  </div>
  <div class="data-viewer data-viewer--no-pipeline" v-else />
</template>
<script lang="ts">
import _ from 'lodash';
import Vue from 'vue';
import { Component, Watch } from 'vue-property-decorator';

import Pagination from '@/components/Pagination.vue';
import { resizable } from '@/directives/resizable/resizable';
import { DataSet, DataSetColumn, DataSetColumnType } from '@/lib/dataset';
import { Pipeline, PipelineStepName, FilterStep } from '@/lib/steps';
import { getTranslator } from '@/lib/translators';
import { VQBModule } from '@/store';

import ActionMenu from './ActionMenu.vue';
import ActionToolbar from './ActionToolbar.vue';
import DataTypesMenu from './DataTypesMenu.vue';
import DataViewerCell from './DataViewerCell.vue';
import VariableChooser from './stepforms/widgets/VariableInputs/VariableChooser.vue';
import { VariablesBucket, AvailableVariable, VariableDelimiters } from '@/lib/variables';

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
    VariableChooser,
  },
  directives: { resizable },
})
export default class DataViewer extends Vue {
  @VQBModule.State availableVariables!: VariablesBucket;
  @VQBModule.State dataset!: DataSet;
  @VQBModule.State isLoading!: boolean;
  @VQBModule.State pagesize!: number;
  @VQBModule.State selectedColumns!: string[];
  @VQBModule.State variableDelimiters!: VariableDelimiters;

  @VQBModule.Getter('isDatasetEmpty') isEmpty!: boolean;
  @VQBModule.Getter isDatasetComplete!: boolean;
  @VQBModule.Getter computedActiveStepIndex!: number;
  @VQBModule.Getter columnHeaders!: DataSetColumn[];
  @VQBModule.Getter translator!: string;
  @VQBModule.Getter pipeline?: Pipeline;

  @VQBModule.Mutation createStepForm!: ({
    stepName,
    stepFormDefaults,
  }: {
    stepName: PipelineStepName;
    stepFormDefaults?: object;
  }) => void;
  @VQBModule.Mutation toggleColumnSelection!: ({ column }: { column: string }) => void;
  @VQBModule.Mutation setSelectedColumns!: ({ column }: { column: string }) => void;

  @VQBModule.Action selectStep!: (payload: { index: number }) => void;
  @VQBModule.Mutation setPipeline!: (payload: { pipeline: Pipeline }) => void;

  activeActionMenuColumnName = '';
  activeDataTypeMenuColumnName = '';
  activeVariablesMenuColumnName = '';
  filterValue = '';

  /**
   * @description Get our columns with their names and linked classes
   *
   * @return {Array<object>}
   */
  get formattedColumns() {
    return this.columnHeaders.map(d => {
      return {
        name: d.name,
        type: d.type || 'undefined',
        isActionMenuOpened: this.activeActionMenuColumnName === d.name,
        isDataTypeMenuOpened: this.activeDataTypeMenuColumnName === d.name,
        class: {
          'data-viewer__header-cell': true,
          'data-viewer__header-cell--active': this.isSelected(d.name),
        },
      };
    });
  }

  get columnNames(): string[] {
    return this.formattedColumns.map(({ name }: { name: string }) => name);
  }

  get iconClass() {
    if (this.isSupported('convert')) {
      return { 'data-viewer__header-icon': true, 'data-viewer__header-icon--active': true };
    } else {
      return { 'data-viewer__header-icon': true, 'data-viewer__header-icon--active': false };
    }
  }

  /**
   * @description Create filter step with selected variable
   *
   * @param {AvailableVariable} - variable
   * @param {string} - column name
   */
  setFilterWithVariable(variable: AvailableVariable, columnName: string) {
    const filterWithVariableStep: FilterStep = {
      name: 'filter',
      condition: {
        column: columnName,
        operator: 'eq',
        value: `${this.variableDelimiters.start} ${variable} ${this.variableDelimiters.end}`
      }
    };

    if (this.pipeline) {
      const newPipeline: Pipeline = [...this.pipeline];
      const index =  this.computedActiveStepIndex + 1;
      newPipeline.splice(index, 0, filterWithVariableStep);
      this.setPipeline({ pipeline: newPipeline });
      this.selectStep({ index });
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
      case 'long':
        return '123';
      case 'float':
        return '1.2';
      case 'date':
        return '<i class="fas fa-calendar-alt" aria-hidden="true"></i>';
      case 'boolean':
        return '<i class="fas fa-check" aria-hidden="true"></i>';
      case 'object':
        return '{ }';
      default:
        return '???';
    }
  }

  openDataTypeMenu(name: string) {
    this.activeDataTypeMenuColumnName = name;
    this.setSelectedColumns({ column: name });
  }

  closeDataTypeMenu() {
    this.activeDataTypeMenuColumnName = '';
  }

  openMenu(name: string) {
    this.activeActionMenuColumnName = name;
    this.setSelectedColumns({ column: name });
  }

  closeMenu() {
    this.activeActionMenuColumnName = '';
  }

  openVariablesMenu(name: string) {
    this.activeVariablesMenuColumnName = name;
    this.setSelectedColumns({ column: name });
  }

  closeVariablesMenu(name: string) {
    this.activeVariablesMenuColumnName = '';
  }

  /**
   * These menus are associated to the column headers.
   * It makes sense to close them when the headers change.
   */
  @Watch('columnHeaders')
  onSelectedColumnsChange(before: any, after: any) {
    // we compare old header to new header
    const columnsDifferences: DataSetColumn[] = _.differenceWith(before, after, _.isEqual);
    // if the difference is only on one column with same name that active one ...
    const isModifyingTheSameColumn =
      columnsDifferences.length === 1 &&
      columnsDifferences[0].name === this.activeActionMenuColumnName;
    // ... we won't close the menu because we are just editing a col (ex: loadAllValues )
    if (!isModifyingTheSameColumn) {
      // but we close it if changing the headers
      this.closeMenu();
      this.closeDataTypeMenu();
    }
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
  ::v-deep *,
  ::v-deep ::after,
  ::v-deep ::before {
    box-sizing: border-box;
  }

  ::v-deep button {
    outline: none;
  }

  ::v-deep fieldset {
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
  //firefox hack for border-collapse issue
  background-clip: padding-box;
  max-width: 140px;
  min-width: 140px;
}

.data-viewer-cell {
  background-color: #fafafa;
  white-space: normal;
  overflow: hidden;
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
  display: inline-block;
  vertical-align: text-bottom;
  text-overflow: ellipsis;
  max-width: calc(100% - 45px);
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
  justify-content: center;
}

.data-viewer__header-action-filter {
  position: absolute;
  font-size: 12px;
  right: 32px;
  top: 9px;
  transition: opacity 300ms ease;
  display: flex;
  width: 12px;
  height: 12px;
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

<style lang="scss">
@import '../styles/_variables';
.data-viewer__header-cell--resizable {
  border-left: 1px solid transparent;
  border-right: 1px solid transparent;
  &:hover {
    border-left-color: $data-viewer-border-color;
    border-right-color: $data-viewer-border-color;
  }
}
</style>
