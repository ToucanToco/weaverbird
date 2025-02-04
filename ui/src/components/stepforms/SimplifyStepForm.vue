<template>
  <div>
    <StepFormHeader
      :title="title"
      :stepName="editedStep.name"
      :version="version"
      :backendError="backendError"
    />
    <InputNumberWidget
      v-model="editedStep.tolerance"
      :min="0"
      name="Tolerance"
      data-path=".tolerance"
      :errors="errors"
    />
    <StepFormButtonbar />
  </div>
</template>
<script lang="ts">
import { defineComponent, PropType } from 'vue';

import type { PipelineStepName, SimplifyStep } from '@/lib/steps';

import BaseStepForm from './StepForm.vue';
import InputNumberWidget from './widgets/InputNumber.vue';

export default defineComponent({
  name: 'simplify-step-form',
  components: {
    InputNumberWidget,
  },
  extends: BaseStepForm,
  props: {
    initialStepValue: {
      type: Object as PropType<Partial<SimplifyStep>>,
      default: (): Partial<SimplifyStep> => ({
        name: 'simplify',
        tolerance: 1,
      }),
    },
  },
  data() {
    return {
      stepname: 'simplify' as PipelineStepName,
      title: 'Simplify geographical data' as string,
      editedStep: {
        ...this.initialStepValue,
        ...this.stepFormDefaults,
      },
    };
  },
  methods: {
    submit() {
      this.$$super.submit();
    },
  },
});
</script>
