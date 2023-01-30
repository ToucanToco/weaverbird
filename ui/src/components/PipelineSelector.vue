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

import { Action, Getter, State } from 'pinia-class';
import { VQBModule, type VQBActions } from '@/store';

@Component({
  name: 'PipelineSelector',
})
export default class Vqb extends Vue {
  @State(VQBModule) currentPipelineName?: string;
  @Getter(VQBModule) pipelinesNames!: string[];

  @Action(VQBModule) selectPipeline!: VQBActions['selectPipeline'];

  selectPipelineByName(pipelineName: string) {
    this.selectPipeline({ name: pipelineName });
  }
}
</script>
