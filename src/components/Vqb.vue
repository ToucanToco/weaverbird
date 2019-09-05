<template>
  <div class="visual-query-builder">
    <ResizablePanels>
      <QueryBuilder slot="left-panel" />
      <DataViewer slot="right-panel" />
    </ResizablePanels>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import DataViewer from '@/components/DataViewer.vue';
import QueryBuilder from '@/components/QueryBuilder.vue';
import ResizablePanels from '@/components/ResizablePanels.vue';

@Component({
  name: 'vqb',
  components: {
    DataViewer,
    QueryBuilder,
    ResizablePanels,
  },
})
export default class Vqb extends Vue {}
</script>
<style lang="scss" scoped>
.visual-query-builder {
  flex: 1;
  height: 100%;
  background-color: white;
}
</style>

