<template>
  <div>
    <step-form-title :title="title" :stepName="this.editedStep.name" />
    <MultiselectWidget
      id="pipelinesInput"
      v-model="editedStep.pipelines"
      name="Select datasets to append:"
      :options="Object.keys(pipelines).filter(p => p !== currentPipelineName)"
      placeholder="Select datasets"
      data-path=".pipelines"
      :errors="errors"
    />
    <step-form-buttonbar :cancel="cancelEdition" :submit="submit" />
  </div>
</template>

<script lang="ts">
import { Prop } from 'vue-property-decorator';

import { AppendStep, Pipeline } from '@/lib/steps';
import { StepFormComponent } from '@/components/formlib';
import { VQBModule } from '@/store';

import MultiselectWidget from './widgets/Multiselect.vue';
import BaseStepForm from './StepForm.vue';

@StepFormComponent({
  vqbstep: 'append',
  name: 'append-step-form',
  components: {
    MultiselectWidget,
  },
})
export default class AppendStepForm extends BaseStepForm<AppendStep> {
  @Prop({ type: Object, default: () => ({ name: 'append', pipelines: [] }) })
  initialStepValue!: AppendStep;

  @VQBModule.State currentPipelineName!: string;
  @VQBModule.State pipelines!: { [k: string]: Pipeline };

  readonly title: string = 'Append datasets';
}
</script>
