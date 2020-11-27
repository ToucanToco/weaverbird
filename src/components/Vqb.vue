<template>
  <div class="weaverbird">
    <PipelineSelector class="weaverbird__pipeline-selector" />
    <ResizablePanels>
      <QueryBuilder slot="left-panel" />
      <DataViewer slot="right-panel" />
    </ResizablePanels>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { Component } from 'vue-property-decorator';

import DataViewer from './DataViewer.vue';
import PipelineSelector from './PipelineSelector.vue';
import QueryBuilder from './QueryBuilder.vue';
import ResizablePanels from './ResizablePanels.vue';

@Component({
  name: 'vqb',
  components: {
    DataViewer,
    PipelineSelector,
    QueryBuilder,
    ResizablePanels,
  },
})
export default class Vqb extends Vue {}
</script>

<style lang="scss" scoped>
.weaverbird {
  flex: 1;
  height: 100%;
  background-color: white;
  position: relative;
}

.weaverbird__pipeline-selector {
  position: absolute;
  background-color: white;
  border-top-left-radius: 0.5em;
  border-top-right-radius: 0.5em;
  transform: translateY(-100%);
  padding: 5px 10px;
  top: 0;
  left: 20px;
}
</style>
