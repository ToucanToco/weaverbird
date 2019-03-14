<template>
  <div class="query-pipeline">
    <DomainSelector
      :domains-list="domainsList"
      :selected-domain="stepDomain.domain"
      @selectedDomain="updateDomain"
    />
    <div v-if="isEmpty" class="query-pipeline__empty-container">
      <div class="query-pipeline__empty-message">
          Start playing with data right from the table opposite or switch to Code View with
          <i class="fas fa-code"></i> !
      </div>
      <i class="fas fa-magic"></i>
    </div>
    <Step
      v-else
      v-for="(step, index) in stepsWithoutDomain"
      :key="index"
      :is-active="index === selectedIndex"
      :is-disabled="isDisabled(index)"
      :is-first="index === 0"
      :is-last="index === stepsWithoutDomain.length - 1"
      :step="step"
      @selectedStep="selectStep(index)"
    />
  </div>
</template>


<script lang="ts">
import Vue from 'vue'
import { Component, Prop } from 'vue-property-decorator'

import { PipelineStep } from '@/lib/steps'
import DomainSelector from './DomainSelector.vue'
import Step from './Step.vue'

@Component({
  name: 'pipeline',
  components: {
    DomainSelector,
    Step,
  },
})
export default class Pipeline extends Vue {
  @Prop()
  steps!: Array<PipelineStep>

  @Prop()
  domainsList!: Array<string>

  selectedStep: number = -1
  activePipeline: Array<PipelineStep> = []
  disabledPipeline: Array<PipelineStep> = []

  get selectedIndex() {
    if (this.selectedStep < 0) {
      return this.stepsWithoutDomain.length -1
    }

    return this.selectedStep
  }

  get isEmpty() {
    return this.stepsWithoutDomain.length === 0
  }

  get stepDomain() {
    return this.steps[0]
  }

  get stepsWithoutDomain() {
    return this.steps.slice(1).concat(this.disabledPipeline)
  }

  isDisabled(index: number) {
    if (this.selectedStep < 0) {
      return false;
    }
    return index > this.selectedStep
  }

  selectStep(index: number) {
    let pipeline: Array<PipelineStep> = []
    this.selectedStep = index

    this.activePipeline = this.stepsWithoutDomain.slice(0, this.selectedStep + 1)

    // Separate steps that are after the selected one to keep in memory
    this.disabledPipeline = this.stepsWithoutDomain.slice(this.selectedStep + 1, this.stepsWithoutDomain.length)

    // We emit the active pipeline with the step 0 (select domain) to the parent
    this.$emit('selectedPipeline', pipeline.concat(this.stepDomain, this.activePipeline))
  }

  resetSelectedStep() {
    this.selectedStep = -1
  }

  updateDomain(newDomain: string) {
    return newDomain // Emit an event
  }
}
</script>

<style lang="scss" scoped>
  @import '../styles/Pipeline';
</style>
