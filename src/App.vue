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
import { Mutation, State } from 'vuex-class';
import { VQBState } from '@/store';
import DataViewer from './components/DataViewer.vue';
import PipelineComponent from './components/Pipeline.vue';
import ResizablePanels from './components/ResizablePanels.vue';
import { Pipeline } from '@/lib/steps';
import { mongoResultsToDataset } from '@/lib/dataset/mongo';

import fakeDataset from './fake_dataset.json';

@Component({
  components: {
    DataViewer,
    Pipeline: PipelineComponent,
    ResizablePanels,
  },
})
export default class App extends Vue {
  @State('pipeline') steps!: Pipeline;
  @State domains!: Array<string>;

  @Mutation setDomains!: (domains: Pick<VQBState, 'domains'>) => void;
  @Mutation setPipeline!: (pipeline: Pick<VQBState, 'pipeline'>) => void;
  @Mutation setDataset!: (dataset: Pick<VQBState, 'dataset'>) => void;

  mounted() {
    this.setPipeline({
      pipeline: [
        { name: 'domain', domain: 'cities_data' },
        { name: 'filter', column: 'my-column', value: 42, operator: 'eq' },
        { name: 'rename', oldname: 'my-column', newname: 'new-name' },
      ]
    });
    this.setDomains({
      domains: ['horizontal_barchart', 'bubble_chart', 'cities_data']
    });
    this.setDataset({ dataset: mongoResultsToDataset(fakeDataset) });
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
