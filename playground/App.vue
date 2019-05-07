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
    <pre><code>{{ code }}</code></pre>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import { PipelineStep } from '@/lib/steps';
import { DataSet } from '@/lib/dataset';
import { mongoResultsToDataset } from '@/lib/dataset/mongo';
import { DataViewer, Pipeline, ResizablePanels, getTranslator } from '../dist/vue-query-builder.common.js';

const mongo36translator = getTranslator('mongo36');
const pipeline: Array<PipelineStep> = [
  { name: 'domain', domain: 'reports' },
  { name: 'filter', column: 'entityName', value: 'Troll face', operator: 'eq' },
  { name: 'filter', column: 'id', value: 'yolo', operator: 'eq' },
];

@Component({
  components: {
    DataViewer,
    Pipeline,
    ResizablePanels,
  },
})
export default class App extends Vue {
  steps = pipeline;
  domainsList = [];
  code: string = JSON.stringify(mongo36translator.translate(pipeline), null, 2);
  dataset: DataSet = {
    headers: [{ name: 'col1' }, { name: 'col2' }, { name: 'col3' }],
    data: [
      [12, 13, 14],
      [15, 19, 15],
      [16, 20, 16],
    ]
  };

  mounted() {
    fetch('/collections')
      .then(res => res.json())
      .then(collections => this.domainsList = collections);
  }

  setSteps(pipeline: Array<PipelineStep>) {
    this.steps = pipeline;
    if (!pipeline.length || pipeline[0].name !== 'domain') {
      throw new Error('first step should be a domain step to specify the collection');
    }
    const [domainStep, ...subpipeline] = pipeline;
    const query = mongo36translator.translate(subpipeline);
    this.code = JSON.stringify(query, null, 2);
    fetch('/query', {
      method: 'POST',
      body: JSON.stringify({ query, collection: domainStep.domain }),
      headers: {
        'Content-Type': 'application/json'
      }
    })
      .then(res => res.json())
      .then(dataset => this.dataset = mongoResultsToDataset(dataset));
  }
}
</script>
