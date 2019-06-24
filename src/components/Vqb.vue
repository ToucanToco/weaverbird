<template>
  <div class="visual-query-builder">
    <ResizablePanels>
      <transition slot="left-panel" v-if="isEditingStep" name="slide-right" mode="out-in">
        <component
          key="stepForm"
          :is="formToInstantiate"
          :initialStepValue="initialValue"
          :isStepCreation="isStepCreation"
          @cancel="toggleStepEdition"
          @formSaved="saveStep"
        ></component>
      </transition>
      <transition slot="left-panel" v-else name="slide-left" mode="out-in">
        <Pipeline key="pipeline" @editStep="openStepForm"/>
      </transition>
      <DataViewer slot="right-panel" @stepCreated="openStepForm"/>
    </ResizablePanels>
  </div>
</template>

<script lang="ts">
import Vue, { VueConstructor } from 'vue';
import { Component } from 'vue-property-decorator';
import { Getter, Mutation, State } from 'vuex-class';
import { VQBState } from '@/store/state';
import { Pipeline, PipelineStep } from '@/lib/steps';
import DataViewer from '@/components/DataViewer.vue';
import PipelineComponent from '@/components/Pipeline.vue';
import ResizablePanels from '@/components/ResizablePanels.vue';
import '@/components/stepforms'; // required to load all step forms
import { STEPFORM_REGISTRY } from './formlib';

@Component({
  components: {
    DataViewer,
    Pipeline: PipelineComponent,
    ResizablePanels,
  },
})
export default class Vqb extends Vue {
  @State pipeline!: Pipeline;
  @State isEditingStep!: boolean;

  @Getter computedActiveStepIndex!: number;

  @Mutation setCurrentDomain!: (payload: Pick<VQBState, 'currentDomain'>) => void;
  @Mutation selectStep!: (payload: { index: number }) => void;
  @Mutation setPipeline!: (payload: Pick<VQBState, 'pipeline'>) => void;
  @Mutation toggleStepEdition!: () => void;

  formToInstantiate?: VueConstructor<Vue>;
  initialValue: any = undefined;
  editedStepIndex: number = -1;
  stepName!: string;

  get isStepCreation() {
    return this.editedStepIndex === -1;
  }

  openStepForm(params: PipelineStep, index: number) {
    // If another step edition form is already open, first close it
    if (this.isEditingStep) {
      this.toggleStepEdition();
    }
    this.formToInstantiate = STEPFORM_REGISTRY[params.name];
    if (this.formToInstantiate === undefined) {
      console.error('No corresponding form for this step');
      return;
    }
    this.initialValue = { ...params }; // make a copy
    if (index !== undefined) {
      this.editedStepIndex = index;
      const prevIndex = Math.max(index - 1, 0);
      this.selectStep({ index: prevIndex });
    } else {
      this.editedStepIndex = -1;
    }
    // Display step edition form in the left panel
    this.toggleStepEdition();
  }

  saveStep(step: PipelineStep) {
    // Reset value from DataViewer
    this.initialValue = undefined;
    const newPipeline: Pipeline = [...this.pipeline];
    // FIXME: not sure about that specific implem to handle `domain` step
    const index = step.name === 'domain' ? 0 : this.computedActiveStepIndex + 1;
    if (this.isStepCreation) {
      newPipeline.splice(index, 0, step);
    } else {
      newPipeline.splice(index, 1, step);
    }
    if (step.name === 'domain') {
      this.setCurrentDomain({ currentDomain: step.domain });
    } else {
      this.setPipeline({ pipeline: newPipeline });
    }
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
.slide-left-enter,
.slide-left-leave-to {
  transform: translateX(-100%);
  opacity: 0;
}
.slide-left-enter-active {
  transition: all 0.3s ease;
}
.slide-right-enter,
.slide-right-leave-to {
  transform: translateX(100%);
  opacity: 0;
}
.slide-right-enter-active {
  transition: all 0.3s ease;
}
</style>

