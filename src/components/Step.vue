<template>
  <div :class="classContainer" @click="select()">
    <div class="query-pipeline-queue">
      <div :class="firstStrokeClass" />
      <div class="query-pipeline-queue__dot">
        <div class="query-pipeline-queue__dot-ink" />
      </div>
      <div :class="lastStrokeClass" />
    </div>
    <div class="query-pipeline-step">
      <span class="query-pipeline-step__name" :title="stepLabel()">{{ stepLabel() }}</span>
      <div class="query-pipeline-step__actions">
        <!-- @click.stop is used to avoid to trigger select event when editing a step -->
        <div class="query-pipeline-step__action" @click.stop="editStep()">
          <i class="fas fa-cog" />
        </div>
        <div
          v-if="!isFirst"
          class="query-pipeline-step__action"
          @click="toggleDeleteConfirmationModal"
        >
          <i class="fas fa-trash-alt" />
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

import { humanReadableLabel } from '@/lib/labeller';
import { PipelineStep } from '@/lib/steps';
import { VQBModule } from '@/store';
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
  readonly isLastActive!: boolean;

  @Prop(Boolean)
  readonly isDisabled!: boolean;

  @Prop()
  step!: PipelineStep;

  @Prop()
  readonly indexInPipeline!: number;

  deleteConfirmationModalIsOpened = false;

  @VQBModule.Mutation deleteStep!: MutationCallbacks['deleteStep'];

  @VQBModule.Getter stepConfig!: (index: number) => PipelineStep;

  stepLabel() {
    return humanReadableLabel(this.step);
  }

  get classContainer() {
    return {
      'query-pipeline-step__container': true,
      'query-pipeline-step__container--active': this.isActive,
      'query-pipeline-step__container--last-active': this.isLastActive,
      'query-pipeline-step__container--disabled': this.isDisabled,
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

  editStep() {
    this.$emit('editStep', this.stepConfig(this.indexInPipeline), this.indexInPipeline);
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
