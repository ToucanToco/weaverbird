<template functional>
  <td
    class="data-viewer-cell"
    :class="{
      'data-viewer-cell--active': props.isSelected,
      'data-viewer-cell--numeric': $options.methods.isNumeric(props.value)
    }"
    data-cy="weaverbird-data-viewer-cell"
  >
    {{ $options.methods.getValue(props.value) }}
  </td>
</template>
<script lang="ts">
/**
 * @name DataViewerCell
 * @description A table cell displayed in a DataViewer
 *
 * @param {boolean} isSelected - Weather the cell is selected or is in a selected column
 * @param {string} value - The cell's value
 */
export default {
  name: 'data-viewer-cell',
  props: {
    value: {
      default: () => '-',
    },
    isSelected: {
      type: Boolean,
      default: () => false,
    },
  },
  methods: {
    getValue(value: any) {
      return typeof value === 'object' && !(value instanceof Date)
        ? JSON.stringify(value)
        : value.toString();
    },

    isNumeric(value: any): boolean {
      return typeof value === 'number';
    }
  },
};
</script>
<style lang="scss">
.data-viewer-cell--numeric {
  text-align: right;

  // Ensure that digits all take the same width, so they stay aligned vertically
  font-variant-numeric: tabular-nums;
}
</style>
