<template>
  <div class="query-pipeline-step__container">
    <div class="query-pipeline-queue">
      <div :class="firstStrokeClass"></div>
      <div :class="classDot" @click="select()">
        <div :class="classDotInk"></div>
      </div>
      <div :class="lastStrokeClass"></div>
    </div>
    <div :class="classStep">
      <span class="query-pipeline-step__name">{{ step.name }}</span>
      <div class="query-pipeline-step__actions">
        <div class="query-pipeline-step__action">
          <i class="fas fa-cog"></i>
        </div>
        <div class="query-pipeline-step__action">
          <i class="fas fa-trash-alt"></i>
        </div>
      </div>
    </div>
  </div>
</template>
<script lang="ts">
import Vue from 'vue'
import { Component, Prop } from 'vue-property-decorator'
import { PipelineStep } from '../lib/steps'

@Component({
  name: 'step'
})
export default class Step extends Vue {
  @Prop()
  isFirst: boolean = false

  @Prop()
  isLast: boolean = false

  @Prop()
  isActive: boolean = false

  @Prop()
  isDisabled: boolean = false

  @Prop()
  step: PipelineStep | undefined

  get classDot() {
    return {
      'query-pipeline-queue__dot': true,
      'query-pipeline-queue__dot--active': this.isActive,
      'query-pipeline-queue__dot--disabled': this.isDisabled,
    };
  }

  get classDotInk() {
    return {
      'query-pipeline-queue__dot-ink': true,
      'query-pipeline-queue__dot-ink--active': this.isActive,
      'query-pipeline-queue__dot-ink--disabled': this.isDisabled,
    };
  }

  get classStep() {
    return {
      'query-pipeline-step': true,
      'query-pipeline-step--disabled': this.isDisabled,
    }
  }

  get firstStrokeClass() {
    return {
      'query-pipeline-queue__stroke': true,
      'query-pipeline-queue__stroke--hidden': this.isFirst,
    };
  }

  get lastStrokeClass() {
      return {
        'query-pipeline-queue__stroke': true,
        'query-pipeline-queue__stroke--hidden': this.isLast,
      };
    }


  select() {
    this.$emit('selectedStep');
  }
}
</script>
<style lang="scss" scoped>
  @import '../styles/Steps';
</style>
