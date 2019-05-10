<template>
  <div id="app">
    <ResizablePanels>
      <Pipeline slot="left-panel"/>
      <DataViewer slot="right-panel"/>
    </ResizablePanels>
    <pre><code>{{ code }}</code></pre>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import { Getter, Mutation, State } from 'vuex-class';
import { VQBState, activePipeline } from '@/store/state';
import { Pipeline } from '@/lib/steps';
import { DataSet } from '@/lib/dataset';
import { MongoResults, mongoResultsToDataset } from '@/lib/dataset/mongo';
import { DataViewer, Pipeline as PipelineComponent, ResizablePanels, getTranslator } from '../dist/vue-query-builder.common.js';

const mongo36translator = getTranslator('mongo36');

@Component({
  components: {
    DataViewer,
    'Pipeline': PipelineComponent,
    ResizablePanels,
  },
})
export default class App extends Vue {
  @State pipeline!: Pipeline;
  @State domains!: Array<string>;

  @Getter activePipeline!: Pipeline;

  @Mutation setDomains!: (payload: Pick<VQBState, 'domains'>) => void;
  @Mutation setPipeline!: (payload: Pick<VQBState, 'pipeline'>) => void;
  @Mutation setDataset!: (payload: Pick<VQBState, 'dataset'>) => void;

  get code() {
    const query = mongo36translator.translate(this.activePipeline);
    return JSON.stringify(query, null, 2);
  }

  async mounted() {
    const response = await fetch('/collections');
    const collections = await response.json();
    this.setDomains({ domains: collections });
    await this.updateData(this.pipeline);
  }

  async updateData(pipeline: Pipeline) {
    this.setPipeline({ pipeline });
    if (!pipeline.length || pipeline[0].name !== 'domain') {
      throw new Error('first step should be a domain step to specify the collection');
    }
    const [domainStep, ...subpipeline] = pipeline;
    const query = mongo36translator.translate(subpipeline);
    const response = await fetch('/query', {
      method: 'POST',
      body: JSON.stringify({ query, collection: domainStep.domain }),
      headers: {
        'Content-Type': 'application/json'
      }
    });
    const mongorset = await response.json();
    this.setDataset({ dataset: mongoResultsToDataset(mongorset as MongoResults) });
  }

}
</script>
