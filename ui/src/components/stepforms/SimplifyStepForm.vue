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
import Component from 'vue-class-component';
import { Prop } from 'vue-property-decorator';

import type { PipelineStepName, SimplifyStep } from '@/lib/steps';

import BaseStepForm from './StepForm.vue';
import InputNumberWidget from './widgets/InputNumber.vue';

@Component({
  name: 'simplify-step-form',
  components: {
    InputNumberWidget,
  },
})
export default class SimplifyStepForm extends BaseStepForm<SimplifyStep> {
  stepname: PipelineStepName = 'simplify';

  @Prop({
    type: Object,
    default: () => ({
      name: 'simplify',
      tolerance: 1,
    }),
  })
  declare initialStepValue: SimplifyStep;

  readonly title: string = 'Simplify geographical data';

  submit() {
    this.$$super.submit();
  }
}
</script>
