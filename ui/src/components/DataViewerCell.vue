<template>
  <td
    class="data-viewer-cell"
    :class="{
      'data-viewer-cell--numeric': isNumeric,
    }"
    data-cy="weaverbird-data-viewer-cell"
  >
    {{ stringifiedValue }}
  </td>
</template>

<script lang="ts">
import type { DataSetColumnType } from '@/types';
import Vue, { type PropType } from 'vue';

import { formatCellValue } from './format-cell-value';

/**
 * @name DataViewerCell
 * @description A table cell displayed in a DataViewer
 *
 * @param {string} value - The cell's value
 */
export default Vue.extend({
  name: 'data-viewer-cell',

  props: {
    value: {
      default: () => '-',
    },
    type: {
      type: String as PropType<DataSetColumnType | undefined>,
      default: undefined,
    }
  },

  computed: {
    stringifiedValue(): string {
      return formatCellValue(this.value, this.type);
    },
    isNumeric(): boolean {
      return typeof this.value === 'number';
    },
  },
});
</script>

<style lang="scss" scoped>
.data-viewer-cell--numeric {
  text-align: right;

  // Ensure that digits all take the same width, so they stay aligned vertically
  font-variant-numeric: tabular-nums;
}
</style>
