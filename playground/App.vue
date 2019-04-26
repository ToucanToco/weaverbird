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
            <th :key="col" v-for="col in dataset.columns">{{ col.name }}</th>
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

type DataSetColumn = {
  name: string;
  type?: 'integer' | 'float' | 'boolean' | 'string' | 'date' | 'object';
};

type DataSet = {
  columns: Array<DataSetColumn>;
  data: Array<Array<any>>;
};

/**
 * implement set union
 * > setUnion(new Set([1, 2, 3]), new Set([2, 4, 6]))
 * Set([1, 2, 3, 4, 6])
 */
function setUnion<T>(set1: Set<T>, set2: Set<T>): Set<T> {
  const result = new Set(set1);
  set2.forEach(val => result.add(val));
  return result;
}


/**
 * transform a mongo resultset (i.e. a list of json documents) into
 * a `DataSet` structure
 */
function formatDataset(results: Array<{ [k: string]: any }>): DataSet {
  const dataset: DataSet = { columns: [], data: [] };
  if (results.length) {
    // each document migh have a different set of keys therefore we need
    // to loop over all documents and make the union of all keys
    const colnames = results
      .map(row => new Set(Object.keys(row)))
      .reduce(setUnion, new Set());
    // transform set of names to list of DataSetColumn objects
    dataset.columns = Array.from(colnames).map(name => ({ name }));
    for (const row of results) {
      dataset.data.push(dataset.columns.map(coldef => row[coldef.name] || null));
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
    columns: [{ name: 'col1' }, { name: 'col2' }, { name: 'col3' }],
    data: [
      [12, 13, 14],
      [15, 19, 15],
      [16, 20, 16],
    ]
  };

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
      .then(dataset => this.dataset = formatDataset(dataset));
  }
}
</script>
