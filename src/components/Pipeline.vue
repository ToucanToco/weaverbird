<template>
  <div class="query-pipeline">
    <Draggable
      class="query-pipeline__draggable"
      v-model="orderedSteps"
      handle=".query-pipeline-step__action--handle"
      draggable=".query-pipeline-step__container--draggable"
      @end="updateSelectedStep"
    >
      <Step
        v-for="(step, index) in orderedSteps"
        :key="index"
        :is-active="index < activeStepIndex"
        :is-last-active="index === activeStepIndex"
        :is-disabled="isDisabled(index)"
        :is-first="index === 0"
        :is-last="index === steps.length - 1"
        :toDelete="toDelete({ index })"
        :isEditable="!isDeletingSteps"
        :step="step"
        :indexInPipeline="index"
        :variable-delimiters="variableDelimiters"
        @selectedStep="selectStep({ index: index })"
        @editStep="editStep"
        @toggleDelete="toggleStepToDelete({ index })"
      />
    </Draggable>
    <div class="query-pipeline__delete-steps-container" v-if="stepsToDelete.length">
      <div class="query-pipeline__delete-steps" @click="openDeleteConfirmationModal">
        <i aria-hidden="true" class="fas fa-trash" />
        Delete [{{ stepsToDelete.length }}] selected
      </div>
    </div>
    <div class="query-pipeline__tips-container">
      <div class="query-pipeline__tips">
        Interact with the widgets and table on the right to add steps
      </div>
      <i class="fas fa-magic" aria-hidden="true" />
    </div>
    <DeleteConfirmationModal
      v-if="deleteConfirmationModalIsOpened"
      @cancelDelete="closeDeleteConfirmationModal"
      @validateDelete="deleteSelectedSteps"
    />
  </div>
</template>

<script lang="ts">
import _xor from 'lodash/xor';
import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import Draggable from 'vuedraggable';

import { DomainStep, Pipeline, PipelineStep } from '@/lib/steps';
import { VariableDelimiters } from '@/lib/variables';
import { VQBModule } from '@/store';
import { MutationCallbacks } from '@/store/mutations';

import DeleteConfirmationModal from './DeleteConfirmationModal.vue';
import Step from './Step.vue';

@Component({
  name: 'pipeline',
  components: {
    DeleteConfirmationModal,
    Draggable,
    Step,
  },
})
export default class PipelineComponent extends Vue {
  // pipeline steps to delete based on their indexes
  stepsToDelete: number[] = [];
  deleteConfirmationModalIsOpened = false;

  @VQBModule.State domains!: string[];
  @VQBModule.State variableDelimiters!: VariableDelimiters;
  @VQBModule.State selectedStepIndex!: number;

  @VQBModule.Getter('computedActiveStepIndex') activeStepIndex!: number;
  @VQBModule.Getter domainStep!: DomainStep;
  @VQBModule.Getter('pipeline') steps!: Pipeline;
  @VQBModule.Getter('isPipelineEmpty') onlyDomainStepIsPresent!: boolean;
  @VQBModule.Getter('isStepDisabled') isDisabled!: (index: number) => boolean;

  @VQBModule.Action selectStep!: ({ index }: { index: number }) => void;
  @VQBModule.Action deleteSteps!: (payload: { indexes: number[] }) => void;
  @VQBModule.Mutation setPipeline!: MutationCallbacks['setPipeline'];

  get orderedSteps(): Pipeline {
    return this.steps;
  }

  set orderedSteps(pipeline: Pipeline) {
    this.setPipeline({ pipeline });
  }

  get isDeletingSteps(): boolean {
    return this.stepsToDelete.length > 0;
  }

  get currentSelectedIndex(): number {
    // selectedStepIndex for last step is -1 by default, we need to retrieve real index
    return this.selectedStepIndex === -1 ? this.steps.length - 1 : this.selectedStepIndex;
  }

  editStep(step: PipelineStep, index: number) {
    this.$emit('editStep', step, index);
  }

  toDelete({ index }: { index: number }): boolean {
    return this.stepsToDelete.indexOf(index) !== -1;
  }

  toggleStepToDelete({ index }: { index: number }): void {
    // toggle step to delete using its index in pipeline
    this.stepsToDelete = _xor(this.stepsToDelete, [index]);
  }

  openDeleteConfirmationModal(): void {
    this.deleteConfirmationModalIsOpened = true;
  }

  closeDeleteConfirmationModal(): void {
    this.deleteConfirmationModalIsOpened = false;
  }

  deleteSelectedSteps(): void {
    this.deleteSteps({ indexes: this.stepsToDelete });
    // clean steps to delete
    this.stepsToDelete = [];
    this.closeDeleteConfirmationModal();
  }

  updateSelectedStep(event: any): void {
    // update selected step index only if dragged step is already current selected one
    // (otherwise keep selected step unchanged)
    if (event.oldIndex === this.currentSelectedIndex) {
      this.selectStep({ index: event.newIndex });
    }
  }
}
</script>

<style lang="scss" scoped>
.query-pipeline {
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 20px;
}

.query-pipeline__draggable {
  width: 100%;
}

.query-pipeline__tips-container {
  width: 60%;
  display: flex;
  flex-direction: column;
  align-items: center;
  font-weight: lighter;
}

.query-pipeline__tips {
  font-size: 24px;
  color: rgb(154, 154, 154);
  margin-top: 120px;
  margin-bottom: 40px;
  text-align: center;
}

.query-pipeline__delete-steps-container {
  margin-top: 10px;
  padding-left: 40px;
  width: 100%;
}

.query-pipeline__delete-steps {
  background: #b52519;
  padding: 15px;
  width: 100%;
  text-align: center;
  text-transform: uppercase;
  color: white;
  letter-spacing: 1.5px;
  font-size: 12px;
  font-weight: bold;
  cursor: pointer;
  border-radius: 2px;
}

.fa-code {
  color: rgb(239, 239, 239);
}

.fa-magic {
  color: rgb(239, 239, 239);
  font-size: 64px;
}
</style>
