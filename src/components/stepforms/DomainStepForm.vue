<template>
  <div>
    <StepFormHeader :title="title" :stepName="editedStep.name" />
    <AutocompleteWidget
      class="domainInput"
      v-model="editedStep.domain"
      name="Select a dataset to start..."
      :options="availableDomains"
      placeholder="Choose a dataset"
    />
    <StepFormButtonbar :errors="errors" />
  </div>
</template>

<script lang="ts">
import { Prop } from 'vue-property-decorator';

import { StepFormComponent } from '@/components/formlib';
import AutocompleteWidget from '@/components/stepforms/widgets/Autocomplete.vue';
import { DomainStep } from '@/lib/steps';
import { VQBModule } from '@/store';

import BaseStepForm from './StepForm.vue';

@StepFormComponent({
  vqbstep: 'domain',
  name: 'domain-step-form',
  components: {
    AutocompleteWidget,
  },
})
export default class DomainStepForm extends BaseStepForm<DomainStep> {
  @Prop({
    type: Object,
    default: () => ({
      name: 'domain',
      domain: '',
    }),
  })
  initialStepValue!: DomainStep;

  @VQBModule.State domains!: string[];
  @VQBModule.State currentPipelineName!: string;
  @VQBModule.Getter pipelinesNames!: string[];

  readonly title: string = 'Select a dataset';

  get availableDomains(): string[] {
    return this.pipelinesNames
      .filter((name: string) => name !== this.currentPipelineName)
      .concat(this.domains);
  }
}
</script>
