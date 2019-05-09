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
  { name: 'domain', domain: 'test-collection' },
  { name: 'filter', column: 'Value4', value: 1, operator: 'gt' },
  { name: 'replace', search_column: 'Value2', to_replace: [[2, 20], [13, 24]] },
  { name: 'top', rank_on: 'Value2', sort: 'asc', limit: 3 },
  {
    name: 'pivot',
    index: ['Groups'],
    column_to_pivot: 'Label',
    value_column: 'Value2',
    agg_function: 'sum',
  }
  // { name: 'formula', new_column: "result", formula: "Value1 * Value2 + 10 * Value3" },
];

@Component({
  components: {
    DataViewer,
    Pipeline,
    ResizablePanels,
  },
})
export default class App extends Vue {
  dataset: DataSet = {
    headers: [{ name: 'col1' }, { name: 'col2' }, { name: 'col3' }],
    data: [
      [12, 13, 14],
      [15, 19, 15],
      [16, 20, 16],
    ]
  };

  steps = pipeline;
  domainsList = [];
  code: string = JSON.stringify(mongo36translator.translate(pipeline), null, 2);

  mounted() {
    fetch('/collections')
      .then(res => res.json())
      .then(collections => this.domainsList = collections);
    this.updateData(this.steps);
  }

  updateData(pipeline: Array<PipelineStep>) {
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

  setSteps(pipeline: Array<PipelineStep>) {
    console.log('setting steps', pipeline);
    this.steps = pipeline;
    this.updateData(pipeline);
  }
}
</script>
