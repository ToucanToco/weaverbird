<template functional>
  <td
    :class="{'data-viewer-cell': true, 'data-viewer-cell--active': props.isSelected }"
  >{{ props.value }}</td>
</template>
<script lang="ts">
import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';

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
