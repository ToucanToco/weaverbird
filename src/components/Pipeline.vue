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
      :toDelete="toDelete({ index })"
      :step="step"
      :indexInPipeline="index"
      :variable-delimiters="variableDelimiters"
      @selectedStep="selectStep({ index: index })"
      @editStep="editStep"
      @toggleDelete="toggleStepToDelete({ index })"
    />
    <div class="query-pipeline__delete-steps" v-if="stepsToDelete.length">
      Delete [{{ stepsToDelete.length }}] selected
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

import { DomainStep, Pipeline, PipelineStep } from '@/lib/steps';
import { VariableDelimiters } from '@/lib/variables';
import { VQBModule } from '@/store';

import DeleteConfirmationModal from './DeleteConfirmationModal.vue';
import Step from './Step.vue';

@Component({
  name: 'pipeline',
  components: {
    DeleteConfirmationModal,
    Step,
  },
})
export default class PipelineComponent extends Vue {
  // pipeline steps to delete based on their indexes
  stepsToDelete: number[] = [];
  deleteConfirmationModalIsOpened = false;

  @VQBModule.State domains!: string[];
  @VQBModule.State variableDelimiters!: VariableDelimiters;

  @VQBModule.Getter('computedActiveStepIndex') activeStepIndex!: number;
  @VQBModule.Getter domainStep!: DomainStep;
  @VQBModule.Getter('pipeline') steps!: Pipeline;
  @VQBModule.Getter('isPipelineEmpty') onlyDomainStepIsPresent!: boolean;
  @VQBModule.Getter('isStepDisabled') isDisabled!: (index: number) => boolean;

  @VQBModule.Action selectStep!: ({ index }: { index: number }) => void;

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
    // TODO: handle store logic
    // clean steps to delete
    this.stepsToDelete = [];
    this.closeDeleteConfirmationModal();
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

.fa-code {
  color: rgb(239, 239, 239);
}

.fa-magic {
  color: rgb(239, 239, 239);
  font-size: 64px;
}
</style>
