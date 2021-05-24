<template functional>
  <td
    :class="{ 'data-viewer-cell': true, 'data-viewer-cell--active': props.isSelected }"
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
 * @param {boolean} isSelected - Wether the cell is selected or is in a selected column
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
      return typeof value === 'object' ? JSON.stringify(value) : value.toString();
    },
  },
};
</script>
<style lang="scss"></style>
