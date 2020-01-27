<template>
  <div class="query-builder">
    <transition v-if="isEditingStep" name="slide-right" mode="out-in">
      <component
        key="stepForm"
        :is="formComponent"
        :initialStepValue="stepFormInitialValue"
        :isStepCreation="isStepCreation"
        @cancel="closeStepForm"
        @formSaved="saveStep"
      />
    </transition>
    <transition v-else name="slide-left" mode="out-in">
      <div>
        <div class="documentation-help">
          <a
            href="https://weaverbird.toucantoco.com/docs/general-principles/"
            target="_blank"
            class="documentation-help__content"
          >
            <i class="fas fa-question-circle" />
            <p>Need help?</p>
          </a>
        </div>
        <Pipeline key="pipeline" @editStep="editStep" />
      </div>
    </transition>
  </div>
</template>
<script lang="ts">
import '@/components/stepforms'; // required to load all step forms

import Vue from 'vue';
import { Component } from 'vue-property-decorator';

import PipelineComponent from '@/components/Pipeline.vue';
import { Pipeline, PipelineStep, PipelineStepName } from '@/lib/steps';
import { VQBModule } from '@/store';
import { VQBState } from '@/store/state';

import { STEPFORM_REGISTRY } from './formlib';

@Component({
  name: 'query-builder',
  components: {
    Pipeline: PipelineComponent,
  },
})
export default class QueryBuilder extends Vue {
  @VQBModule.State currentStepFormName!: PipelineStepName;
  @VQBModule.State pipeline!: Pipeline;
  @VQBModule.State stepFormInitialValue!: object;

  @VQBModule.Getter computedActiveStepIndex!: number;
  @VQBModule.Getter isEditingStep!: boolean;

  @VQBModule.Mutation closeStepForm!: () => void;
  @VQBModule.Mutation openStepForm!: (payload: {
    stepName: PipelineStepName;
    initialValue: object;
  }) => void;
  @VQBModule.Mutation resetStepFormInitialValue!: () => void;
  @VQBModule.Mutation setCurrentDomain!: (payload: Pick<VQBState, 'currentDomain'>) => void;
  @VQBModule.Mutation selectStep!: (payload: { index: number }) => void;
  @VQBModule.Mutation setPipeline!: (payload: Pick<VQBState, 'pipeline'>) => void;

  get isStepCreation() {
    return this.stepFormInitialValue === undefined;
  }

  get formComponent() {
    return STEPFORM_REGISTRY[this.currentStepFormName];
  }

  editStep(params: PipelineStep, index: number) {
    this.openStepForm({ stepName: params.name, initialValue: params });
    const prevIndex = Math.max(index - 1, 0);
    this.selectStep({ index: prevIndex });
  }

  saveStep(step: PipelineStep) {
    const newPipeline: Pipeline = [...this.pipeline];
    // FIXME: not sure about that specific implem to handle `domain` step
    const index = step.name === 'domain' ? 0 : this.computedActiveStepIndex + 1;
    if (this.isStepCreation) {
      newPipeline.splice(index, 0, step);
    } else {
      newPipeline.splice(index, 1, step);
    }
    if (step.name === 'domain') {
      this.setCurrentDomain({ currentDomain: step.domain });
    } else {
      this.setPipeline({ pipeline: newPipeline });
    }
    this.selectStep({ index });
    this.closeStepForm();
    // Reset value from DataViewer
    this.resetStepFormInitialValue();
  }
}
</script>
<style lang="scss" scoped>
@import '../styles/_variables';

.slide-left-enter,
.slide-left-leave-to {
  transform: translateX(-100%);
  opacity: 0;
}

.slide-left-enter-active {
  transition: all 0.3s ease;
}

.slide-right-enter,
.slide-right-leave-to {
  transform: translateX(100%);
  opacity: 0;
}

.slide-right-enter-active {
  transition: all 0.3s ease;
}

.documentation-help {
  display: flex;
  justify-content: center;
  margin-top: -15px;
  margin-bottom: -10px;
}

.documentation-help__content {
  display: flex;
  align-items: center;
  font-size: 12px;
  text-decoration: none;
  color: $base-color;

  &:hover {
    color: $active-color;
  }

  p {
    text-decoration: underline;
  }

  .fas.fa-question-circle {
    margin-right: 5px;
  }
}
</style>
