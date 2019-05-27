<template>
  <ResizablePanels>
    <FormRenameStep
      v-if="isEditingStep"
      :initialValue="initialValue"
      slot="left-panel"
      @cancel="cancelStepEdition"
      @formSaved="saveStep"
    />
    <Pipeline v-else slot="left-panel"/>
    <DataViewer slot="right-panel" @stepCreated="openStepForm"/>
  </ResizablePanels>
</template>

<script lang="ts">

import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import { Mutation, State } from 'vuex-class';
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
  @State domains!: string[];

  @Mutation setDomains!: (payload: Pick<VQBState, 'domains'>) => void;
  @Mutation setPipeline!: (payload: Pick<VQBState, 'pipeline'>) => void;
  @Mutation setDataset!: (payload: Pick<VQBState, 'dataset'>) => void;

  isEditingStep: boolean = false;
  initialValue: any = undefined;

  cancelStepEdition() {
    this.isEditingStep = false;
  }

  openStepForm(params: any) {
    // params.name will be used to choose the right form
    // after that, we delete from params to pass down the others keys to initialValue
    this.initialValue = _.omit(params, 'name');
    this.isEditingStep = true;
  }

  saveStep(step: PipelineStep) {
    console.log('SAVE STEP', step)
    // Reset value from DataViewer
    this.initialValue = undefined;
    this.setPipeline({ pipeline: [...this.pipeline, step] });
    this.isEditingStep = false;
  }
}

</script>
