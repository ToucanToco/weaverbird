<template>
  <div class="query-builder" data-cy="weaverbird-query-builder" v-if="pipeline">
    <transition v-if="isEditingStep" name="slide-right" mode="out-in">
      <StepForm
        key="stepForm"
        ref="step"
        :name="currentStepFormName"
        :initialStepValue="stepFormInitialValue"
        :stepFormDefaults="stepFormDefaults"
        :backendError="backendError"
        @back="closeStepForm"
        @formSaved="saveStep"
      />
    </transition>
    <transition v-else name="slide-left" mode="out-in">
      <div>
        <div class="documentation-help">
          <a
            href="https://weaverbird.toucantoco.dev/docs/general-principles/"
            target="_blank"
            rel="noopener"
            class="documentation-help__content"
            :data-version="version"
          >
            <FAIcon icon="question-circle" />&nbsp;
            <p>Need help?</p>
          </a>
        </div>
        <Pipeline key="pipeline" @editStep="editStep" />
      </div>
    </transition>
  </div>
  <div class="query-builder query-builder--no-pipeline" v-else>Select a pipeline...</div>
</template>
<script lang="ts">
import { defineComponent } from 'vue';
import { mapActions, mapGetters, mapState } from 'pinia';

import FAIcon from '@/components/FAIcon.vue';
import PipelineComponent from '@/components/Pipeline.vue';
import type { Pipeline, PipelineStep, PipelineStepName } from '@/lib/steps';
import { VQBModule } from '@/store';

import { version } from '../../package.json';
import StoreStepFormComponent from './stepforms/StoreStepFormComponent.vue';

export default defineComponent({
  name: 'query-builder',
  
  components: {
    StepForm: StoreStepFormComponent,
    Pipeline: PipelineComponent,
    FAIcon,
  },
  
  data() {
    return {
      version: version, // display the current version of the package
      editedStepBackendError: undefined as string | undefined
    };
  },
  
  computed: {
    ...mapState(VQBModule, [
      'currentStepFormName',
      'stepFormInitialValue',
      'stepFormDefaults'
    ]),
    
    ...mapGetters(VQBModule, [
      'computedActiveStepIndex',
      'isEditingStep',
      'pipeline',
      'stepErrors'
    ]),
    
    isStepCreation() {
      return this.stepFormInitialValue === undefined;
    },
    
    backendError(): string | undefined {
      return this.isStepCreation ? undefined : this.editedStepBackendError;
    }
  },
  
  methods: {
    ...mapActions(VQBModule, [
      'closeStepForm',
      'openStepForm',
      'resetStepFormInitialValue',
      'selectStep',
      'setPipeline'
    ]),
    
    editStep(params: PipelineStep, index: number) {
      // save the selected edited step error to avoid store to be refreshed with new data and lose it when entering the step form
      this.editedStepBackendError = this.stepErrors(index);
      this.openStepForm({ stepName: params.name, initialValue: params });
      const prevIndex = Math.max(index - 1, 0);
      this.selectStep({ index: prevIndex });
    },
    
    saveStep(step: PipelineStep) {
      const newPipeline: Pipeline = [...this.pipeline];
      const index = step.name === 'domain' ? 0 : this.computedActiveStepIndex + 1;
      if (this.isStepCreation) {
        newPipeline.splice(index, 0, step);
      } else {
        newPipeline.splice(index, 1, step);
      }
      this.setPipeline({ pipeline: newPipeline });
      this.selectStep({ index });
      this.closeStepForm();
      // Reset value from DataViewer
      this.resetStepFormInitialValue();
    }
  }
});
</script>
<style lang="scss" scoped>
@import '../styles/_variables';

.query-builder {
  @extend %main-font-style;
  ::v-deep *,
  ::v-deep ::after,
  ::v-deep ::before {
    box-sizing: border-box;
  }

  ::v-deep button {
    outline: none;
  }

  ::v-deep fieldset {
    border: none;
  }
}

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
}
</style>
