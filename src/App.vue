<template>
  <div id="app">
    <img alt="Vue logo" src="./assets/logo.png">
    <Pipeline :steps="steps" :domains-list="domainsList" @selectedPipeline="setSteps"/>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import Pipeline from './components/Pipeline.vue';
import { PipelineStep } from '@/lib/steps';

@Component({
  components: {
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

  setSteps(pipeline: Array<PipelineStep>) {
    this.steps = pipeline;
  }
}
</script>

<style>
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
