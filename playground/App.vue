<template>
  <div id="app">
    <vqb/>
    <pre><code>{{ code }}</code></pre>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import { Getter } from 'vuex-class';
import { Pipeline } from '@/lib/steps';
import { Vqb, getTranslator } from '../dist/vue-query-builder.common.js';

const mongo36translator = getTranslator('mongo36');

@Component({
  components: {
    Vqb,
  },

})
export default class App extends Vue {
  @Getter activePipeline!: Pipeline;

  get code() {
    const query = mongo36translator.translate(this.activePipeline);
    return JSON.stringify(query, null, 2);
  }
}
</script>
