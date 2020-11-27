<template>
  <div class="pipeline-selector">
    Pipelines:
    <select :value="currentPipelineName" @input="selectPipelineByName($event.target.value)">
      <option v-for="pipelineName in pipelinesNames" :key="pipelineName" :value="pipelineName">
        {{ pipelineName }}
      </option>
    </select>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { Component } from 'vue-property-decorator';

import { VQBModule } from '../store';

@Component({
  name: 'PipelineSelector',
})
export default class Vqb extends Vue {
  @VQBModule.State currentPipelineName?: string;
  @VQBModule.Getter pipelinesNames!: string[];

  @VQBModule.Action selectPipeline!: (payload: { name: string }) => void;

  selectPipelineByName(pipelineName: string) {
    this.selectPipeline({ name: pipelineName });
  }
}
</script>
