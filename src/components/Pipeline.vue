<template>
  <div class="query-pipeline">
    <div v-if="isEmpty" class="query-pipeline__empty-container">
      <div class="query-pipeline__empty-message">
        Start playing with data right from the table or switch to Code View with
        <i
          class="fas fa-code"
        ></i> !
      </div>
      <i class="fas fa-magic"></i>
    </div>
    <Step
      v-else
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
  </div>
</template>


<script lang="ts">
import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import { Getter, Mutation, State } from 'vuex-class';
import { MutationCallbacks } from '@/store/mutations';
import { DomainStep, Pipeline, PipelineStep } from '@/lib/steps';
import Step from './Step.vue';

@Component({
  name: 'pipeline',
  components: {
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
  @Getter('isStepDisabled') isDisabled!: (index: number) => boolean;

  @Mutation selectStep!: MutationCallbacks['selectStep'];

  editStep(step: PipelineStep, index: number) {
    this.$emit('editStep', step, index);
  }
}
</script>

<style lang="scss" scoped>
@import '../styles/Pipeline';
</style>
