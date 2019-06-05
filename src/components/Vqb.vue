<template>
  <div class="visual-query-builder">
    <ResizablePanels>
      <component
        v-if="isEditingStep"
        :is="formToInstantiate"
        :initialValue="initialValue"
        :isStepCreation="isStepCreation"
        slot="left-panel"
        @cancel="toggleStepEdition"
        @formSaved="saveStep"
      ></component>
      <Pipeline v-else slot="left-panel" @editStep="openStepForm"/>
      <DataViewer slot="right-panel" @stepCreated="openStepForm"/>
    </ResizablePanels>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import { Getter, Mutation, State } from 'vuex-class';
import { VQBState } from '@/store/state';
import { Pipeline, PipelineStep } from '@/lib/steps';
import DataViewer from '@/components/DataViewer.vue';
import FormRenameStep from '@/components/FormRenameStep.vue';
import PipelineComponent from '@/components/Pipeline.vue';
import ResizablePanels from '@/components/ResizablePanels.vue';

import _ from 'lodash';

@Component({
  components: {
    DataViewer,
    FormRenameStep,
    Pipeline: PipelineComponent,
    ResizablePanels,
  },
})
export default class Vqb extends Vue {
  @State pipeline!: Pipeline;
  @State isEditingStep!: boolean;

  @Getter computedActiveStepIndex!: number;

  @Mutation selectStep!: (payload: { index: number }) => void;
  @Mutation setPipeline!: (payload: Pick<VQBState, 'pipeline'>) => void;
  @Mutation toggleStepEdition!: () => void;

  initialValue: any = undefined;
  editedStepIndex: number = -1;
  formToInstantiate: string = 'FormRenameStep';

  get isStepCreation() {
    return this.editedStepIndex === -1;
  }

  openStepForm(params: any, index: number) {
    // params.name will be used to choose the right form
    // after that, we delete from params to pass down the others keys to initialValue
    this.initialValue = _.omit(params, 'name');
    if (index !== undefined) {
      this.editedStepIndex = index;
      this.selectStep({ index: index - 1 });
    } else {
      this.editedStepIndex = -1;
    }
    this.toggleStepEdition();
  }

  saveStep(step: PipelineStep) {
    // Reset value from DataViewer
    this.initialValue = undefined;
    const newPipeline: Pipeline = [...this.pipeline];
    const index = this.computedActiveStepIndex + 1;
    if (this.isStepCreation) {
      newPipeline.splice(index, 0, step);
    } else {
      newPipeline.splice(index, 1, step);
    }
    this.setPipeline({ pipeline: newPipeline });
    this.selectStep({ index });
    this.toggleStepEdition();
  }
}
</script>
<style lang="scss" scoped>
.visual-query-builder {
  flex: 1;
  height: 100%;
  background-color: white;
}
</style>

