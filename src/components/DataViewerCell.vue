<template functional>
  <td
    :class="{'data-viewer-cell': true, 'data-viewer-cell--active': props.isSelected }"
  >{{ props.value }}</td>
</template>
<script lang="ts">
import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';

/**
 * @name DataViewerCell
 * @description A cell display in a DataViewer
 * @param {boolean} isSelected - Wether the cell is selected or is in a selected column
 * @param {string} value - The cell's value
 */
@Component({
  name: 'data-viewer-cell',
})
export default class DataViewerCell extends Vue {
  @Prop({
    default: () => false,
  })
  isSelected!: boolean;

  @Prop({
    default: () => '',
  })
  value!: string;
}
</script>
<style lang="scss">
</style>
