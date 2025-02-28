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
import { defineComponent } from 'vue';
import { mapActions, mapGetters, mapState } from 'pinia';

import { VQBModule } from '@/store';

export default defineComponent({
  name: 'PipelineSelector',
  
  computed: {
    ...mapState(VQBModule, [
      'currentPipelineName'
    ]),
    
    ...mapGetters(VQBModule, [
      'pipelinesNames'
    ])
  },
  
  methods: {
    ...mapActions(VQBModule, [
      'selectPipeline'
    ]),
    
    selectPipelineByName(pipelineName: string) {
      this.selectPipeline({ name: pipelineName });
    }
  }
});
</script>
