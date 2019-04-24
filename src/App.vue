<template>
  <div id="app">
    <ResizablePanels>
      <Pipeline
        slot="left-panel"
        :steps="steps"
        :domains-list="domainsList"
        @selectedPipeline="setSteps"
      />
      <DataViewer slot="right-panel" :dataset="dataset"/>
    </ResizablePanels>
  </div>
</template>

<script lang="ts">
import _ from 'lodash';
import { Component, Vue } from 'vue-property-decorator';
import DataViewer from './components/DataViewer.vue';
import Pipeline from './components/Pipeline.vue';
import { PipelineStep } from '@/lib/steps';

import fakeDataset from './fake_dataset.json';

@Component({
  components: {
    DataViewer,
    Pipeline,
  },
})
export default class App extends Vue {
  steps: Array<PipelineStep> = [
    { name: 'domain', domain: 'cities_data' },
    { name: 'filter', column: 'my-column', value: 42, operator: 'eq' },
    { name: 'rename', oldname: 'my-column', newname: 'new-name' },
  ];

  domainsList = ['horizontal_barchart', 'bubble_chart', 'cities_data'];

  dataset = fakeDataset;

  setSteps(pipeline: Array<PipelineStep>) {
    this.steps = pipeline;
  }
}
</script>

<style>
body {
  margin: 0;
}

#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  height: 100vh;
}
</style>
