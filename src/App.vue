<template>
  <div id="app">
    <img alt="Vue logo" src="./assets/logo.png">
    <Pipeline :steps="steps"/>
  </div>
</template>

<script>
import Pipeline from './components/Pipeline.vue'

export default {
  name: 'app',
  components: {
    Pipeline
  },
  data: () => ({
    steps: [
      { name: 'filter', query: { $match: { my_column: 'Test' } } },
      { name: 'rename', query: { $project: { my_column: 'Test' } } }
    ]
  })
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
