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
      <span class="query-pipeline-step__name" :title="stepTitle" v-html="stepLabel" />
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

import { humanReadableLabel, labelWithReadeableVariables } from '../lib/labeller';
import { PipelineStep } from '../lib/steps';
import { VariableDelimiters } from '../lib/variables';
import { VQBModule } from '../store';
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
  variableDelimiters!: VariableDelimiters;

  @Prop()
  readonly indexInPipeline!: number;

  deleteConfirmationModalIsOpened = false;

  @VQBModule.Action deleteStep;

  @VQBModule.Getter stepConfig!: (index: number) => PipelineStep;

  get stepName(): string {
    return humanReadableLabel(this.step);
  }

  get stepTitle(): string {
    const replaceDelimiters = { start: '', end: '' };
    return labelWithReadeableVariables(this.stepName, this.variableDelimiters, replaceDelimiters);
  }

  get stepLabel(): string {
    const replaceDelimiters = { start: '<em>', end: '</em>' };
    return labelWithReadeableVariables(this.stepName, this.variableDelimiters, replaceDelimiters);
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
@import '../styles/_variables';

@keyframes scaler {
  0% {
    transform: scale(0);
  }

  100% {
    transform: scale(1);
  }
}

.query-pipeline-step__container {
  display: flex;
  flex-direction: row;
  align-items: center;
  height: 70px;
  width: 100%;
  flex-shrink: 0;
}

.query-pipeline-step__container--last-active,
.query-pipeline-step__container--active {
  .query-pipeline-queue__stroke {
    background-color: $active-color-faded-2;
  }

  .query-pipeline-queue__dot {
    background-color: $active-color-faded-2;
    animation: scaler 0.3s;
  }
}

.query-pipeline-step__container--last-active {
  .query-pipeline-queue__dot-ink {
    background-color: $active-color;
  }
}

.query-pipeline-step__container--active {
  .query-pipeline-queue__dot-ink {
    background-color: $active-color-faded;
  }
}

.query-pipeline-step__container--disabled {
  .query-pipeline-queue__dot,
  .query-pipeline-queue__dot-ink,
  .query-pipeline-step {
    opacity: 0.5;
  }
}

.query-pipeline-queue {
  position: relative;
  margin-right: 20px;
  height: 100%;
  flex-direction: column;
  display: flex;
  align-items: center;
  justify-content: center;
}

.query-pipeline-queue__dot {
  background-color: rgb(245, 245, 245);
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  transform: scale(1);
  transition: transform 0.2s;
}

.query-pipeline-queue__dot-ink {
  background-color: rgb(154, 154, 154);
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.query-pipeline-queue__stroke {
  width: 2px;
  flex-grow: 1;
  justify-self: end;
  background-color: rgb(245, 245, 245);
}

.query-pipeline-queue__stroke--hidden {
  visibility: hidden;
}

.query-pipeline-step {
  cursor: pointer;
  min-width: 0;
  width: 100%;
  height: 50px;
  display: flex;
  flex-direction: row;
  padding-left: 12px;
  justify-content: space-between;
  align-items: center;
  background-color: white;
  border: 1px solid rgb(245, 245, 245);
}

.query-pipeline-step__name {
  cursor: pointer;
  font-size: 15px;
  font-weight: 500;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
}

.query-pipeline-step__actions {
  display: flex;
  flex-direction: row;
  height: 100%;
}

.query-pipeline-step__action {
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  height: 100%;
  width: 40px;
  background-color: rgb(239, 239, 239);
  color: rgb(154, 154, 154);
}

.query-pipeline-step__action:hover {
  i {
    color: rgb(71, 71, 71);
  }
}

.query-pipeline-step__action i {
  transition: color 0.3s ease;
}
</style>
