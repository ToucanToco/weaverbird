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
      <div class="query-pipeline__tips">
        Interact with the widgets and table on the right to add steps
      </div>
      <FAIcon icon="wand-magic-sparkles" class="query-pipeline__tips-icon" />
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
import { defineComponent } from 'vue';
import { mapActions, mapGetters, mapState } from 'pinia';
import Draggable from 'vuedraggable';

import FAIcon from '@/components/FAIcon.vue';
import { copyToClipboard, pasteFromClipboard } from '@/lib/clipboard';
import type { DomainStep, Pipeline, PipelineStep, PipelineStepName } from '@/lib/steps';
import { isPipelineStep } from '@/lib/steps';
import type { VariableDelimiters } from '@/lib/variables';
import { VQBModule } from '@/store';

import DeleteConfirmationModal from './DeleteConfirmationModal.vue';
import Step from './Step.vue';

export default defineComponent({
  name: 'pipeline',

  components: {
    DeleteConfirmationModal,
    Draggable,
    Step,
    FAIcon,
  },

  data() {
    return {
      // pipeline steps to delete based on their indexes
      selectedSteps: [] as number[],
      deleteConfirmationModalIsOpened: false,
    };
  },

  computed: {
    ...mapState(VQBModule, ['domains', 'variableDelimiters', 'trustedVariableDelimiters']),

    ...mapGetters(VQBModule, {
      activeStepIndex: 'computedActiveStepIndex',
      domainStep: 'domainStep',
      steps: 'pipeline',
      onlyDomainStepIsPresent: 'isPipelineEmpty',
      isDisabled: 'isStepDisabled',
      supportedSteps: 'supportedSteps',
    }),

    hasSupportedSteps(): boolean {
      return this.supportedSteps.filter((step: PipelineStepName) => step !== 'domain').length > 0;
    },

    arrangedSteps: {
      get(): Pipeline {
        return this.steps;
      },
      set(pipeline: Pipeline) {
        this.updatePipeline({ pipeline });
      },
    },

    isDeletingSteps(): boolean {
      return this.selectedSteps.length > 0;
    },
  },

  created() {
    /* istanbul ignore next */
    document.addEventListener('keydown', this.keyDownEventHandler);
  },

  beforeDestroy() {
    /* istanbul ignore next */
    document.removeEventListener('keydown', this.keyDownEventHandler);
  },

  methods: {
    ...mapActions(VQBModule, ['selectStep', 'deleteSteps', 'addSteps', 'setPipeline']),

    editStep(step: PipelineStep, index: number) {
      this.$emit('editStep', step, index);
    },

    toDelete({ index }: { index: number }): boolean {
      return this.selectedSteps.indexOf(index) !== -1;
    },

    toggleStepToDelete({ index }: { index: number }): void {
      // toggle step to delete using its index in pipeline
      this.selectedSteps = _xor(this.selectedSteps, [index]);
    },

    openDeleteConfirmationModal(): void {
      this.deleteConfirmationModalIsOpened = true;
    },

    closeDeleteConfirmationModal(): void {
      this.deleteConfirmationModalIsOpened = false;
    },

    deleteSelectedSteps(): void {
      this.deleteSteps({ indexes: this.selectedSteps });
      // clean steps to delete
      this.selectedSteps = [];
      this.closeDeleteConfirmationModal();
    },

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
    },

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
    },

    async copySelectedSteps(): Promise<void> {
      // make sure we have selected steps to copy
      if (!this.selectedSteps.length) return;
      // retrieve content of selected steps based on indexes
      const selectedStepsContent: Pipeline = this.steps.filter(
        (_, i: number) => this.selectedSteps.indexOf(i) !== -1,
      );
      // copy selected steps content to clipboard
      await copyToClipboard(JSON.stringify(selectedStepsContent));
    },

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
    },
  },
});
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

.query-pipeline__tips-icon {
  color: rgb(239, 239, 239);
  font-size: 64px;
}
</style>
