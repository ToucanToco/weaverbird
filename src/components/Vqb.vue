<template>
  <div class="weaverbird">
    <ResizablePanels>
      <QueryBuilder slot="left-panel" />
      <DataViewer slot="right-panel" />
    </ResizablePanels>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { Component, Prop, Watch } from 'vue-property-decorator';

import DataViewer from '@/components/DataViewer.vue';
import QueryBuilder from '@/components/QueryBuilder.vue';
import ResizablePanels from '@/components/ResizablePanels.vue';
import { Pipeline } from '@/lib/steps.ts';
import { InterpolateFunction } from '@/lib/templating';
import { registerModule, VQBModule, VQBnamespace } from '@/store';
import { VQBState } from '@/store/state';

@Component({
  name: 'vqb',
  components: {
    DataViewer,
    QueryBuilder,
    ResizablePanels,
  },
})
export default class Vqb extends Vue {
  @Prop({
    type: Object,
    required: true,
  })
  pipelines!: { [name: string]: Pipeline };

  @Prop({
    type: String,
    required: true,
  })
  currentPipelineName!: string;

  @Prop({
    type: Array,
    required: true,
  })
  domains!: Pick<VQBState, 'domains'>;

  @Prop({
    type: String,
    default: () => 'mongo40',
  })
  translator!: string;

  @Prop({
    type: Function,
    default: undefined,
  })
  interpolateFunc!: InterpolateFunction;

  @VQBModule.Action selectPipeline!: (payload: { name: string }) => void;
  @VQBModule.Action updateDataset!: () => void;
  @VQBModule.Mutation setDomains!: (payload: { domains: Pick<VQBState, 'domains'> }) => void;
  @VQBModule.Mutation setCurrentPipelineName!: (payload: { name: string }) => void;

  created() {
    registerModule(this.$store, {
      currentPipelineName: this.currentPipelineName,
      pipelines: this.pipelines,
      interpolateFunc: this.interpolateFunc,
      translator: this.translator,
    });
    this.setDomains({ domains: this.domains });
    this.updateDataset();

    // Watch store to emit events
    this.$store.watch(
      state => state[VQBnamespace('pipelines')],
      (newPipelines: Pick<VQBState, 'pipelines'>) => {
        this.$emit('input', newPipelines);
      },
      { deep: true },
    );
    this.$store.watch(
      state => state[VQBnamespace('backendMessages')],
      (backendMessages: Pick<VQBState, 'backendMessages'>) => {
        this.$emit('input', backendMessages);
      },
      { deep: true },
    );
  }

  @Watch('currentPipelineName')
  onCurrentPipelineName() {
    this.setCurrentPipelineName({ name: this.currentPipelineName });
  }
}
</script>

<style lang="scss" scoped>
.weaverbird {
  flex: 1;
  height: 100%;
  background-color: white;
  position: relative;
}

.weaverbird__pipeline-selector {
  position: absolute;
  background-color: white;
  border-top-left-radius: 0.5em;
  border-top-right-radius: 0.5em;
  transform: translateY(-100%);
  padding: 5px 10px;
  top: 0;
  left: 20px;
}
</style>
