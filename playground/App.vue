<template>
  <div id="app">
    <ResizablePanels>
      <Pipeline
        slot="left-panel"
        :steps="steps"
        :domains-list="domainsList"
        @selectedPipeline="setSteps"
      />
      <table slot="right-panel">
        <thead>
          <tr>
            <th :key="col" v-for="col in dataset.columns">{{ col }}</th>
          </tr>
        </thead>
        <tbody>
          <tr :key="rowidx" v-for="(row, rowidx) in dataset.data">
            <td :key="colidx" v-for="(value, colidx) in row">{{ value }}</td>
          </tr>
        </tbody>
      </table>
    </ResizablePanels>
    <pre><code>{{ code }}</code></pre>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import { PipelineStep } from '@/lib/steps';
import { Pipeline, ResizablePanels, getTranslator } from '../dist/vue-query-builder.common.js';
import { mongodb, pipeline, domains } from './config';

const mongo36translator = getTranslator('mongo36');

type DataSet = {
  columns: Array<string>;
  data: Array<Array<any>>;
}

function formatDataset(results: Array<object>): DataSet {
  const dataset: DataSet = { columns: [], data: [] };
  if (results.length) {
    dataset.columns = Object.keys(results[0]);
    for (const row of results) {
      dataset.data.push(dataset.columns.map(colname => row[colname]));
    }
  }
  return dataset;
}

@Component({
  components: {
    Pipeline,
    ResizablePanels,
  },
})
export default class App extends Vue {
  steps = pipeline;
  domainsList = domains;
  code: string = JSON.stringify(mongo36translator.translate(pipeline), null, 2);
  dataset: DataSet = {
    columns: ['col1', 'col2', 'col3'],
    data: [
      [12, 13, 14],
      [15, 19, 15],
      [16, 20, 16],
    ]
  };

  setSteps(pipeline: Array<PipelineStep>) {
    this.steps = pipeline;
    const query = mongo36translator.translate(pipeline.slice(1));
    this.code = JSON.stringify(query, null, 2);
    fetch('/query', {
      method: 'POST',
      body: JSON.stringify({ query }),
      headers: {
        'Content-Type': 'application/json'
      }
    }).then(res => res.json()).then(dataset => this.dataset = formatDataset(dataset));
  }
}
</script>
