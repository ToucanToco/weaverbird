<template>
  <div class="query-pipeline">
    <DomainSelector :selectedDomain="domainStep.domain"/>
    <div v-if="isEmpty" class="query-pipeline__empty-container">
      <div class="query-pipeline__empty-message">
        Start playing with data right from the table opposite or switch to Code View with
        <i
          class="fas fa-code"
        ></i> !
      </div>
      <i class="fas fa-magic"></i>
    </div>
    <Step
      v-else
      v-for="(step, index) in stepsWithoutDomain"
      :key="index"
      :is-active="index < activeStepIndex"
      :is-disabled="isDisabled(index + 1)"
      :is-first="index === 0"
      :is-last="index === stepsWithoutDomain.length - 1"
      :step="step"
      :indexInPipeline="index + 1"
      @selectedStep="selectStep({ index: index + 1 })"
      @editStep="editStep"
    />
  </div>
</template>


<script lang="ts">
import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import { Getter, Mutation, State } from 'vuex-class';
import { VQBState } from '@/store/state';
import { DomainStep, Pipeline, PipelineStep } from '@/lib/steps';
import DomainSelector from './DomainSelector.vue';
import Step from './Step.vue';

// interface StepConfig {
//   step: PipelineStep;
//   index: number;
// }

@Component({
  name: 'pipeline',
  components: {
    DomainSelector,
    Step,
  },
})
export default class PipelineComponent extends Vue {
  @State('pipeline') steps!: Pipeline;
  @State domains!: string[];
  @State('isPipelineEmpty') isEmpty!: boolean;

  @Getter activePipeline!: Pipeline;
  @Getter('computedActiveStepIndex') activeStepIndex!: number;
  @Getter domainStep!: DomainStep;
  @Getter stepsWithoutDomain!: Pipeline;
  @Getter('isStepDisabled') isDisabled!: (index: number) => boolean;

  @Mutation selectStep!: (payload: Pick<VQBState, 'selectedStepIndex'>) => void;

  resetSelectedStep() {
    this.selectStep({ selectedStepIndex: -1 });
  }

  // editStep(stepConfig: StepConfig) {
  //   this.$emit('editStep', step);
  // }
  editStep(step: PipelineStep, index: number) {
    this.$emit('editStep', step, index);
  }
}
</script>

<style lang="scss" scoped>
@import '../styles/Pipeline';
</style>
