<template>
  <div class="query-pipeline">
    <Step
      v-for="(step, index) in steps"
      :key="index"
      :is-active="index < activeStepIndex"
      :is-last-active="index === activeStepIndex"
      :is-disabled="isDisabled(index)"
      :is-first="index === 0"
      :is-last="index === steps.length - 1"
      :step="step"
      :indexInPipeline="index"
      @selectedStep="selectStep({ index: index })"
      @editStep="editStep"
    />
    <div class="query-pipeline__tips-container">
      <div class="query-pipeline__tips">
        Interact with the widgets and table on the right to add steps
      </div>
      <i class="fas fa-magic" />
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { Component } from 'vue-property-decorator';

import { DomainStep, Pipeline, PipelineStep } from '@/lib/steps';
import { VQBModule } from '@/store';
import { MutationCallbacks } from '@/store/mutations';

import Step from './Step.vue';

@Component({
  name: 'pipeline',
  components: {
    Step,
  },
})
export default class PipelineComponent extends Vue {
  @VQBModule.State domains!: string[];

  @VQBModule.Getter('computedActiveStepIndex') activeStepIndex!: number;
  @VQBModule.Getter domainStep!: DomainStep;
  @VQBModule.Getter('pipeline') steps!: Pipeline;
  @VQBModule.Getter('isPipelineEmpty') onlyDomainStepIsPresent!: boolean;
  @VQBModule.Getter('isStepDisabled') isDisabled!: (index: number) => boolean;

  @VQBModule.Mutation selectStep!: MutationCallbacks['selectStep'];

  editStep(step: PipelineStep, index: number) {
    this.$emit('editStep', step, index);
  }
}
</script>

<style lang="scss" scoped>
@import '../styles/Pipeline';
</style>
