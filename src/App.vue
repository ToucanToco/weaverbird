<template>
  <div id="app">
    <img alt="Vue logo" src="./assets/logo.png">
    <Pipeline :steps="steps" :domains-list="domainsList"/>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import Pipeline from './components/Pipeline.vue';

@Component({
  components: {
    Pipeline,
  },
  data: () => ({
    steps: [
      { name: 'domain', domain: 'cities_data' },
      // { name: 'filter', query: { $match: { my_column: 'Test' } } },
      // { name: 'group', query: { $match: { my_column: 'Test' } } },
      // { name: 'rename', query: { $project: { my_column: 'Test' } } }
    ],
    domainsList: [
      'horizontal_barchart',
      'bubble_chart',
      'cities_data'
    ]
  }),
})
export default class App extends Vue {}
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
