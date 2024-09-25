<template>
  <div>
    <StepFormHeader
      :title="title"
      :stepName="editedStep.name"
      :version="version"
      :backendError="backendError"
    />
    <AutocompleteWidget
      class="domainInput"
      v-model="editedStep.domain"
      name="Select a dataset to start..."
      :options="availableDatasetNames"
      placeholder="Choose a dataset"
    />
    <StepFormButtonbar :errors="errors" />
  </div>
</template>

<script lang="ts">
import Component from 'vue-class-component';
import { Prop } from 'vue-property-decorator';

import AutocompleteWidget from '@/components/stepforms/widgets/Autocomplete.vue';
import type { DomainStep, PipelineStepName } from '@/lib/steps';

import BaseStepForm from './StepForm.vue';

@Component({
  name: 'domain-step-form',
  components: {
    AutocompleteWidget,
  },
})
export default class DomainStepForm extends BaseStepForm<DomainStep> {
  stepname: PipelineStepName = 'domain';

  @Prop({
    type: Object,
    default: () => ({
      name: 'domain',
      domain: '',
    }),
  })
  declare initialStepValue: DomainStep;

  get availableDatasetNames() {
    return this.availableDomains.map((d) => d.name);
  }

  readonly title: string = 'Select a dataset';
}
</script>
