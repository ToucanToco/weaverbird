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
            <th>Column1</th>
            <th>Column2</th>
            <th>Column3</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>12</td>
            <td>13</td>
            <td>14</td>
          </tr>
          <tr>
            <td>15</td>
            <td>16</td>
            <td>17</td>
          </tr>
          <tr>
            <td>18</td>
            <td>19</td>
            <td>20</td>
          </tr>
        </tbody>
      </table>
    </ResizablePanels>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import { PipelineStep } from '@/lib/steps';
import { Pipeline, ResizablePanels, getTranslator } from '../dist/vue-query-builder.common.js';

@Component({
  components: {
    Pipeline,
    ResizablePanels,
  },
})
export default class App extends Vue {
  steps: Array<PipelineStep> = [
    { name: 'domain', domain: 'cities_data' },
    { name: 'filter', column: 'my-column', value: 42, operator: 'eq' },
    { name: 'rename', oldname: 'my-column', newname: 'new-name' },
  ];
  domainsList = ['horizontal_barchart', 'bubble_chart', 'cities_data'];

  setSteps(pipeline: Array<PipelineStep>) {
    this.steps = pipeline;
    const mongo36translator = getTranslator('mongo36');
    console.log('query====>', mongo36translator.translate(pipeline));
  }
}
</script>
