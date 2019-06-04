<template>
  <div class="query-pipeline-step__container" @click="select()">
    <div class="query-pipeline-queue">
      <div :class="firstStrokeClass"></div>
      <div :class="classDot">
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
          <i class="fas fa-trash-alt" @click="toggleDeleteConfirmationModal"></i>
        </div>
      </div>
    </div>
    <DeleteConfirmationModal
      v-if="deleteConfirmationModalIsOpened"
      @cancelDelete="toggleDeleteConfirmationModal"
      @validateDelete="deleteThisStep"
    />
  </div>
</template>
<script lang="ts">
import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';
import { Mutation } from 'vuex-class';
import { PipelineStep } from '@/lib/steps';
import { MutationCallbacks } from '@/store/mutations';
import DeleteConfirmationModal from './DeleteConfirmationModal.vue';

@Component({
  name: 'step',
  components: {
    DeleteConfirmationModal,
  },
})
export default class Step extends Vue {
  @Prop(Boolean)
  readonly isFirst!: boolean;

  @Prop(Boolean)
  readonly isLast!: boolean;

  @Prop(Boolean)
  readonly isActive!: boolean;

  @Prop(Boolean)
  readonly isDisabled!: boolean;

  @Prop()
  step!: PipelineStep;

  @Prop()
  readonly indexInPipeline!: number;

  deleteConfirmationModalIsOpened: boolean = false;

  @Mutation deleteStep!: MutationCallbacks['deleteStep'];

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
    };
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

  deleteThisStep() {
    this.toggleDeleteConfirmationModal();
    this.deleteStep({ index: this.indexInPipeline });
  }

  select() {
    this.$emit('selectedStep');
  }

  toggleDeleteConfirmationModal() {
    this.deleteConfirmationModalIsOpened = !this.deleteConfirmationModalIsOpened;
  }
}
</script>
<style lang="scss" scoped>
@import '../styles/Steps';
</style>
