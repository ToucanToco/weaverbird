<template>
  <div>
    <StepFormHeader :title="title" :stepName="this.editedStep.name" />
    <MultiselectWidget
      class="pipelinesInput"
      v-model="editedStep.pipelines"
      name="Select datasets to append:"
      :options="availableDomains"
      placeholder="Select datasets"
      data-path=".pipelines"
      :errors="errors"
    />
    <StepFormButtonbar />
  </div>
</template>

<script lang="ts">
import { Prop } from 'vue-property-decorator';

import { StepFormComponent } from '@/components/formlib';
import { AppendStep } from '@/lib/steps';
import { VQBModule } from '@/store';

import BaseStepForm from './StepForm.vue';
import MultiselectWidget from './widgets/Multiselect.vue';

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
  @VQBModule.State domains!: string[];
  @VQBModule.Getter pipelinesNames!: string[];

  readonly title: string = 'Append datasets';

  get availableDomains(): string[] {
    return this.pipelinesNames
      .filter((name: string) => name !== this.currentPipelineName)
      .concat(this.domains);
  }
}
</script>
