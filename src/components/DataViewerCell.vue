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
import Vue from 'vue';

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
  },

  computed: {
    stringifiedValue(): string {
      return this.getValue(this.value);
    },
    isNumeric(): boolean {
      return typeof this.value === 'number';
    },
  },

  methods: {
    getValue(value: any): string {
      return typeof value === 'object' && !(value instanceof Date)
        ? JSON.stringify(value)
        : value.toString();
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
