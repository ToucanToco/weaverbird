<template>
  <div class="query-pipeline" data-cy="weaverbird-pipeline">
    <Draggable
      class="query-pipeline__draggable"
      v-model="arrangedSteps"
      handle=".query-pipeline-step__action--handle"
      draggable=".query-pipeline-step__container--draggable"
    >
      <Step
        v-for="(step, index) in arrangedSteps"
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
        :trusted-variable-delimiters="trustedVariableDelimiters"
        @selectedStep="selectStep({ index: index })"
        @editStep="editStep"
        @toggleDelete="toggleStepToDelete({ index })"
      />
    </Draggable>
    <div class="query-pipeline__delete-steps-container" v-if="selectedSteps.length">
      <div
        class="query-pipeline__delete-steps"
        data-cy="weaverbird-delete-steps"
        @click="openDeleteConfirmationModal"
      >
        <FAIcon icon="trash" />
        Delete [{{ selectedSteps.length }}] selected
      </div>
    </div>
    <div class="query-pipeline__tips-container" v-if="hasSupportedSteps">
      <div class="query-pipeline__tips">No steps added yet</div>
      <div class="query-pipeline__tips-2">
        Use the widgets on the right to add steps to the pipeline.
      </div>
      <div class="button-ai-preparation" @click="openAIModal">
        <MagicIcon />
        <span class="button-ai-prepation__text">AI preparation</span>
      </div>
    </div>
    <DeleteConfirmationModal
      v-if="deleteConfirmationModalIsOpened"
      @cancelDelete="closeDeleteConfirmationModal"
      @validateDelete="deleteSelectedSteps"
    />
    <AIModal v-if="AIModalIsOpened" @cancel="closeAIModal" />
  </div>
</template>

<script lang="ts">
import _xor from 'lodash/xor';
import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import Draggable from 'vuedraggable';

import FAIcon from '@/components/FAIcon.vue';
import { copyToClipboard, pasteFromClipboard } from '@/lib/clipboard';
import type { DomainStep, Pipeline, PipelineStep, PipelineStepName } from '@/lib/steps';
import { isPipelineStep } from '@/lib/steps';
import type { VariableDelimiters } from '@/lib/variables';
import { Action, Getter, State } from 'pinia-class';
import { VQBModule, type VQBActions } from '@/store';

import DeleteConfirmationModal from './DeleteConfirmationModal.vue';
import Step from './Step.vue';
// @ts-ignore
import MagicIcon from './MagicIcon.vue';
// @ts-ignore
import AIModal from './AIModal.vue';

@Component({
  name: 'pipeline',
  components: {
    DeleteConfirmationModal,
    Draggable,
    Step,
    FAIcon,
    MagicIcon,
    AIModal,
  },
})
export default class PipelineComponent extends Vue {
  // pipeline steps to delete based on their indexes
  selectedSteps: number[] = [];
  deleteConfirmationModalIsOpened = false;
  AIModalIsOpened = false;

  @State(VQBModule) domains!: string[];
  @State(VQBModule) variableDelimiters!: VariableDelimiters;
  @State(VQBModule) trustedVariableDelimiters!: VariableDelimiters;

  @Getter(VQBModule, 'computedActiveStepIndex') activeStepIndex!: number;
  @Getter(VQBModule) domainStep!: DomainStep;
  @Getter(VQBModule, 'pipeline') steps!: Pipeline;
  @Getter(VQBModule, 'isPipelineEmpty') onlyDomainStepIsPresent!: boolean;
  @Getter(VQBModule, 'isStepDisabled') isDisabled!: (index: number) => boolean;
  @Getter(VQBModule) supportedSteps!: PipelineStepName[];

  @Action(VQBModule) selectStep!: VQBActions['selectStep'];
  @Action(VQBModule) deleteSteps!: VQBActions['deleteSteps'];
  @Action(VQBModule) addSteps!: VQBActions['addSteps'];
  @Action(VQBModule) setPipeline!: VQBActions['setPipeline'];

  get hasSupportedSteps(): boolean {
    return this.supportedSteps.filter((step) => step !== 'domain').length > 0;
  }

  get arrangedSteps(): Pipeline {
    return this.steps;
  }

  set arrangedSteps(pipeline: Pipeline) {
    this.updatePipeline({ pipeline });
  }

  get isDeletingSteps(): boolean {
    return this.selectedSteps.length > 0;
  }

  created() {
    /* istanbul ignore next */
    document.addEventListener('keydown', this.keyDownEventHandler);
  }

  destroyed() {
    /* istanbul ignore next */
    document.removeEventListener('keydown', this.keyDownEventHandler);
  }

  editStep(step: PipelineStep, index: number) {
    this.$emit('editStep', step, index);
  }

  toDelete({ index }: { index: number }): boolean {
    return this.selectedSteps.indexOf(index) !== -1;
  }

  toggleStepToDelete({ index }: { index: number }): void {
    // toggle step to delete using its index in pipeline
    this.selectedSteps = _xor(this.selectedSteps, [index]);
  }

  openDeleteConfirmationModal(): void {
    this.deleteConfirmationModalIsOpened = true;
  }

  closeDeleteConfirmationModal(): void {
    this.deleteConfirmationModalIsOpened = false;
  }

  openAIModal(): void {
    this.AIModalIsOpened = true;
  }

  closeAIModal(): void {
    console.log('CLOSE MODAL');
    this.AIModalIsOpened = false;
  }

  deleteSelectedSteps(): void {
    this.deleteSteps({ indexes: this.selectedSteps });
    // clean steps to delete
    this.selectedSteps = [];
    this.closeDeleteConfirmationModal();
  }

  updatePipeline({ pipeline }: { pipeline: Pipeline }): void {
    // keep active step content in memory to retrieve new index
    const selectedStepContent = JSON.stringify(this.steps[this.activeStepIndex]);
    // update pipeline
    this.setPipeline({ pipeline });
    // update index of active step based on old content
    const newActiveStepIndex = this.steps.findIndex(
      (step: PipelineStep) => JSON.stringify(step) === selectedStepContent,
    );
    this.selectStep({ index: newActiveStepIndex });
  }

  keyDownEventHandler(event: KeyboardEvent): void {
    const isPasting: boolean = event.key == 'v' && (event.ctrlKey || event.metaKey);
    const isCopying: boolean = event.key == 'c' && (event.ctrlKey || event.metaKey);
    const isDeleting: boolean = event.key === 'Backspace';
    const isNotFocusingAnyInput = document.activeElement === document.body;

    if (isCopying) {
      this.copySelectedSteps();
    } else if (isPasting) {
      this.pasteSelectedSteps();
    } else if (isDeleting && isNotFocusingAnyInput) {
      this.openDeleteConfirmationModal();
    }
  }

  async copySelectedSteps(): Promise<void> {
    // make sure we have selected steps to copy
    if (!this.selectedSteps.length) return;
    // retrieve content of selected steps based on indexes
    const selectedStepsContent: Pipeline = this.steps.filter(
      (_, i: number) => this.selectedSteps.indexOf(i) !== -1,
    );
    // copy selected steps content to clipboard
    await copyToClipboard(JSON.stringify(selectedStepsContent));
  }

  async pasteSelectedSteps(): Promise<void> {
    // retrieve data from clipboard
    const stepsFromClipBoard: string = await pasteFromClipboard();
    // parse steps string
    const parsedSteps: any = JSON.parse(stepsFromClipBoard) ?? [];
    // verify is steps object are well formatted
    if (Array.isArray(parsedSteps) && parsedSteps.every((step) => isPipelineStep(step))) {
      // add new steps to pipeline
      this.addSteps({ steps: parsedSteps });
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
  justify-content: center;
  flex: 1 0 0;
  gap: 16px;
  margin-top: 100px;
}

// .query-pipeline__tips {
//   font-size: 24px;
//   color: rgb(154, 154, 154);
//   margin-top: 120px;
//   margin-bottom: 40px;
//   text-align: center;
// }
.query-pipeline__tips {
  color: #000;
  text-align: center;
  /* title-16 */
  font-family: Montserrat;
  font-size: 16px;
  font-style: normal;
  font-weight: 600;
  line-height: 120%; /* 19.2px */
}

.query-pipeline__tips-2 {
  color: #000;
  text-align: center;

  /* body-14 */
  font-family: Montserrat;
  font-size: 14px;
  font-style: normal;
  font-weight: 500;
  line-height: 150%; /* 21px */
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

.query-pipeline__tips-icon {
  color: rgb(239, 239, 239);
  font-size: 64px;
}

.button-ai-preparation {
  display: flex;
  padding: 4px 8px;
  justify-content: center;
  align-items: center;
  gap: 4px;

  border-radius: 4px;
  border: 1px solid #b933cf;
  background: #fff;
  cursor: pointer;
}

.button-ai-preparation-icon {
  width: 15.273px;
  height: 16px;
}
.button-ai-prepation__text {
  color: var(--Dark, #252525);
  text-align: center;

  /* button-16 */
  font-family: Montserrat;
  font-size: 16px;
  font-style: normal;
  font-weight: 600;
  line-height: 120%;
}
</style>
